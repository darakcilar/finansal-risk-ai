"""
Explainable AI (XAI) Module
---------------------------
Provides feature importance, decision path, local explanation,
and SHAP values utilities for the trained risk model.
"""

import numpy as np
import shap  
import traceback

FEATURE_NAMES = [
    "RevolvingUtilizationOfUnsecuredLines",
    "age",
    "NumberOfTime30-59DaysPastDueNotWorse",
    "DebtRatio",
    "MonthlyIncome",
    "NumberOfOpenCreditLinesAndLoans",
    "NumberOfTimes90DaysLate",
    "NumberRealEstateLoansOrLines",
    "NumberOfTime60-89DaysPastDueNotWorse",
    "NumberOfDependents",
]

FEATURE_LABELS_TR = {
    "RevolvingUtilizationOfUnsecuredLines": "Kredi Kartı Kullanım Oranı",
    "age": "Yaş",
    "NumberOfTime30-59DaysPastDueNotWorse": "30-59 Gün Gecikme Sayısı",
    "DebtRatio": "Borç/Gelir Oranı",
    "MonthlyIncome": "Aylık Gelir",
    "NumberOfOpenCreditLinesAndLoans": "Açık Kredi Sayısı",
    "NumberOfTimes90DaysLate": "90+ Gün Gecikme Sayısı",
    "NumberRealEstateLoansOrLines": "Gayrimenkul Kredi Sayısı",
    "NumberOfTime60-89DaysPastDueNotWorse": "60-89 Gün Gecikme Sayısı",
    "NumberOfDependents": "Bakmakla Yükümlü Kişi Sayısı",
}

def get_feature_importance(model):
    try:
        importances = model.feature_importances_
    except AttributeError:
        return []

    result = []
    for i, imp in enumerate(importances):
        fname = FEATURE_NAMES[i] if i < len(FEATURE_NAMES) else f"feature_{i}"
        result.append({
            "feature": fname,
            "label": FEATURE_LABELS_TR.get(fname, fname),
            "importance": round(float(imp), 4),
        })
    result.sort(key=lambda x: x["importance"], reverse=True)
    return result

def get_decision_path(model, input_array):
    steps = []
    try:
        if hasattr(model, "estimators_"):
            tree = model.estimators_[0]
            estimator = tree[0] if hasattr(tree, "__getitem__") and not hasattr(tree, "tree_") else tree
        elif hasattr(model, "tree_"):
            estimator = model
        else:
            return steps

        tree = estimator.tree_
        node_indicator = estimator.decision_path(input_array)
        node_indices = node_indicator.indices

        for node_id in node_indices:
            if tree.children_left[node_id] == tree.children_right[node_id]:
                values = tree.value[node_id].flatten()
                if len(values) >= 2:
                    total = values.sum()
                    risk_prob = values[1] / total if total > 0 else 0
                else:
                    risk_prob = values[0]
                steps.append({
                    "type": "leaf",
                    "description": f"Sonuç: Risk olasılığı = {risk_prob:.2%}",
                    "risk_probability": round(float(risk_prob), 4),
                })
            else:
                feature_idx = tree.feature[node_id]
                threshold = tree.threshold[node_id]
                feature_name = FEATURE_NAMES[feature_idx] if feature_idx < len(FEATURE_NAMES) else f"feature_{feature_idx}"
                feature_label = FEATURE_LABELS_TR.get(feature_name, feature_name)
                value = float(input_array[0][feature_idx])
                direction = "<=" if value <= threshold else ">"

                steps.append({
                    "type": "decision",
                    "feature": feature_name,
                    "label": feature_label,
                    "threshold": round(float(threshold), 4),
                    "value": round(value, 4),
                    "direction": direction,
                    "description": f"{feature_label}: {value:.4f} {direction} {threshold:.4f}",
                })
    except Exception as e:
        pass

    return steps

def generate_local_explanation(model, input_array, feature_importances, prediction_proba):
    explanations = []
    risk_prob = float(prediction_proba)
    risk_level = "high" if risk_prob >= 0.7 else "medium" if risk_prob >= 0.4 else "low"
    
    # SHAP ve NLG Kısımları (Özetler)
    top_feature_label = None
    top_impact_direction = "increase"
    if feature_importances and len(feature_importances) > 0:
        top_feature_label = feature_importances[0]["label"]

    xai_advice = ""
    if risk_prob >= 0.7:
        xai_advice = "Mevcut finansal verileriniz Yüksek Risk kategorisine işaret ediyor. Finansal sağlığınızı korumak için acil adımlar atmanız büyük önem taşıyor."
    elif risk_prob >= 0.4:
        xai_advice = "Verileriniz Orta Risk seviyesinde değerlendirilmiştir. Mali disiplininizi korumalı ve risk oluşturabilecek alanlara dikkat etmelisiniz."
    else:
        xai_advice = "Mevcut profiliniz Düşük Risk kategorisinde yer almaktadır. Finansal durumunuz sağlıklı ve sürdürülebilir bir görünüm sergiliyor."

    if top_feature_label:
        xai_advice += f" Risk skorunuzun belirlenmesindeki en güçlü faktör, {top_feature_label} değişkenindeki mevcut durumunuzdur."

    short_summary = ""
    if risk_prob >= 0.7:
        short_summary = "⚠️ Yüksek risk profili tespit edildi. Ana risk faktörlerini aşağıdan detaylıca inceleyebilirsiniz."
    elif risk_prob >= 0.4:
        short_summary = "⚡ Orta düzey risk profili. Bazı finansal göstergeleriniz yakın takip gerektiriyor."
    else:
        short_summary = "✅ Düşük risk profili. Finansal durumunuz genel standartlara göre sağlıklı görünüyor."


    # =========================================================================
    # JAVASCRIPT KURAL MOTORUNUN PYTHON'A BİREBİR ÇEVRİLMİŞ HALİ
    # =========================================================================
    risk_factors = []
    positive_factors = []

    # 1. Kredi Kartı Kullanım Oranı
    cc_util = float(input_array[0][0])
    if cc_util > 0.7:
        risk_factors.append({
            "feature": 'Kredi Kartı Kullanım Oranı', "icon": '💳', "severity": 'critical',
            "currentValue": f"%{int(cc_util * 100)}", "idealRange": '%0 – %30', "status": 'Çok Yüksek',
            "explanation": f"Kredi kartlarınızın %{int(cc_util * 100)}'ini kullanıyorsunuz. Kredi limitinizin %30'undan fazlasını kullanmak, finansal baskı altında olduğunuz izlenimini verir.",
            "advice": ['Kredi kartı bakiyenizi limitin %30\'unun altına düşürmeye çalışın.', 'En yüksek faizli karttan başlayarak borçları ödeyin (avalanche yöntemi).', 'Yeni alışverişlerde banka kartı kullanmayı tercih edin.']
        })
    elif cc_util > 0.3:
        risk_factors.append({
            "feature": 'Kredi Kartı Kullanım Oranı', "icon": '💳', "severity": 'warning',
            "currentValue": f"%{int(cc_util * 100)}", "idealRange": '%0 – %30', "status": 'Orta',
            "explanation": f"Kredi kartı kullanım oranınız %{int(cc_util * 100)}. Kabul edilebilir seviyede ancak %30'un altına düşürmek risk puanınızı olumlu etkileyecektir.",
            "advice": ['Aylık bakiyenizi limitin %30\'unun altında tutmaya özen gösterin.']
        })
    else:
        positive_factors.append({
            "feature": 'Kredi Kartı Kullanım Oranı', "icon": '💳', "currentValue": f"%{int(cc_util * 100)}",
            "message": 'Kredi kartı kullanım oranınız sağlıklı seviyede. Bu, risk puanınızı olumlu etkiliyor.'
        })

    # 2. Yaş
    age = float(input_array[0][1])
    if age < 25:
        risk_factors.append({
            "feature": 'Yaş & Kredi Geçmişi', "icon": '👤', "severity": 'info',
            "currentValue": f"{int(age)} yaş", "idealRange": '30+ yaş', "status": 'Genç Profil',
            "explanation": f"{int(age)} yaşındasınız. Genç yaş, kısa kredi geçmişi anlamına gelir. Finans kuruluşları daha uzun kredi geçmişi olan bireyleri daha güvenilir bulur.",
            "advice": ['Kredi geçmişinizi erken oluşturmak için düzenli ve küçük miktarlı kredi kullanın.', 'Tüm faturalarınızı zamanında ödeyerek olumlu bir ödeme geçmişi oluşturun.']
        })
    elif 25 <= age <= 60:
        positive_factors.append({
            "feature": 'Yaş & Kredi Geçmişi', "icon": '👤', "currentValue": f"{int(age)} yaş",
            "message": 'Yaşınız, yeterli kredi geçmişi oluşturmak için uygun bir aralıkta.'
        })

    # 3. Gecikme Sayıları
    late30 = float(input_array[0][2])
    late60 = float(input_array[0][8])
    late90 = float(input_array[0][6])
    total_late = late30 + late60 + late90

    if late90 > 0:
        risk_factors.append({
            "feature": 'Ciddi Ödeme Gecikmeleri (90+ Gün)', "icon": '🚨', "severity": 'critical',
            "currentValue": f"{int(late90)} kez", "idealRange": '0 kez', "status": 'Kritik',
            "explanation": f"Son 2 yılda {int(late90)} kez 90 günden fazla ödeme gecikmesi yaşanmış. Bu durum kredi puanınızı en çok olumsuz etkileyen faktörlerden biridir.",
            "advice": ['Mevcut tüm gecikmeli ödemelerinizi acilen güncelleyin.', 'Otomasitk ödeme talimatı kurarak gelecekteki gecikmeleri önleyin.']
        })
    if late60 > 0:
        risk_factors.append({
            "feature": '60-89 Gün Gecikme', "icon": '⚠️', "severity": 'warning',
            "currentValue": f"{int(late60)} kez", "idealRange": '0 kez', "status": 'Uyarı',
            "explanation": f"{int(late60)} kez 60-89 gün arası ödeme gecikmesi tespit edildi. Bu tür gecikmeler kredi raporunuza olumsuz yansır.",
            "advice": ['Tüm fatura ve kredi ödemeleriniz için otomatik ödeme kurun.']
        })
    if late30 > 0:
        risk_factors.append({
            "feature": '30-59 Gün Gecikme', "icon": '⏰', "severity": 'warning',
            "currentValue": f"{int(late30)} kez", "idealRange": '0 kez', "status": 'Dikkat',
            "explanation": f"{int(late30)} kez 30-59 gün arası ödeme gecikmesi yaşanmış. Her gecikme kredi puanınızı olumsuz etkiler.",
            "advice": ['Ödeme hatırlatıcıları kurun (telefon bildirimi, takvim uyarısı).']
        })
    if total_late == 0:
        positive_factors.append({
            "feature": 'Ödeme Geçmişi', "icon": '✅', "currentValue": '0 gecikme',
            "message": 'Hiç ödeme gecikmesi yok! Mükemmel ödeme disiplini, risk puanınızı çok olumlu etkiliyor.'
        })

    # 4. Borç/Gelir Oranı
    debt_ratio = float(input_array[0][3])
    if debt_ratio > 0.5:
        risk_factors.append({
            "feature": 'Borç / Gelir Oranı', "icon": '📊', "severity": 'critical' if debt_ratio > 0.8 else 'warning',
            "currentValue": f"%{int(debt_ratio * 100)}", "idealRange": '%0 – %35', "status": 'Çok Yüksek' if debt_ratio > 0.8 else 'Yüksek',
            "explanation": f"Aylık borç ödemeleriniz gelirinizin %{int(debt_ratio * 100)}'ini oluşturuyor. Finans kuruluşları genellikle %35'in altındaki oranları sağlıklı kabul eder.",
            "advice": ['En yüksek faizli borçları öncelikli olarak kapatın.', 'Düşük faizli kredi ile yüksek faizli borçları birleştirmeyi değerlendirin.']
        })
    elif debt_ratio > 0.35:
        risk_factors.append({
            "feature": 'Borç / Gelir Oranı', "icon": '📊', "severity": 'info',
            "currentValue": f"%{int(debt_ratio * 100)}", "idealRange": '%0 – %35', "status": 'Dikkat',
            "explanation": f"Borç/gelir oranınız %{int(debt_ratio * 100)}. İdeal aralığın biraz üstünde, ancak yönetilebilir seviyede.",
            "advice": ['Yeni borçlanma yapmadan önce mevcut borçları azaltın.']
        })
    else:
        positive_factors.append({
            "feature": 'Borç / Gelir Oranı', "icon": '📊', "currentValue": f"%{int(debt_ratio * 100)}",
            "message": 'Borç/gelir oranınız sağlıklı seviyede. Finansal durumunuz dengeli.'
        })

    # 5. Aylık Gelir
    income = float(input_array[0][4])
    if income < 3000:
        risk_factors.append({
            "feature": 'Aylık Gelir', "icon": '💰', "severity": 'warning',
            "currentValue": f"{int(income):,} ₺", "idealRange": '5,000+ ₺', "status": 'Düşük',
            "explanation": f"Aylık geliriniz {int(income):,} ₺ seviyesinde. Düşük gelir, beklenmedik harcamalar karşısında mali dayanıklılığı azaltır.",
            "advice": ['Acil durum fonu oluşturun (en az 3 aylık gider karşılığı).', 'Gelir seviyenize uygun bir bütçe planı oluşturun.']
        })
    elif income >= 8000:
        positive_factors.append({
            "feature": 'Aylık Gelir', "icon": '💰', "currentValue": f"{int(income):,} ₺",
            "message": 'Aylık geliriniz yüksek seviyede. Bu, mali dayanıklılığınızı ve risk profilinizi olumlu etkiliyor.'
        })
    else:
        positive_factors.append({
            "feature": 'Aylık Gelir', "icon": '💰', "currentValue": f"{int(income):,} ₺",
            "message": 'Aylık geliriniz orta seviyede. Borçlarınızı yönetilebilir seviyede tutmaya devam edin.'
        })

    # 6. Açık Kredi Sayısı
    open_credits = float(input_array[0][5])
    if open_credits > 10:
        risk_factors.append({
            "feature": 'Açık Kredi Sayısı', "icon": '🏦', "severity": 'warning',
            "currentValue": f"{int(open_credits)} adet", "idealRange": '3 – 7 adet', "status": 'Yüksek',
            "explanation": f"{int(open_credits)} adet açık kredi veya kredi kartınız var. Çok sayıda açık hesap, aşırı borçlanma riskinin göstergesi olabilir.",
            "advice": ['Kullanmadığınız kredi kartlarını kapatmayı değerlendirin.']
        })

    # 7. Bakmakla Yükümlü Kişi
    dependents = float(input_array[0][9])
    if dependents >= 4:
        risk_factors.append({
            "feature": 'Bakmakla Yükümlü Kişi Sayısı', "icon": '👨‍👩‍👧‍👦', "severity": 'info',
            "currentValue": f"{int(dependents)} kişi", "idealRange": 'Gelire orantılı', "status": 'Yüksek Yük',
            "explanation": f"{int(dependents)} kişiye bakmakla yükümlüsünüz. Fazla bağımlı birey, sabit giderleri artırarak finansal esnekliği azaltır.",
            "advice": ['Aile bütçesini detaylı planlayın ve takip edin.', 'Acil durumlar için önceden birikim yapın.']
        })

    # Genel Tavsiye Özeti
    if risk_level == 'high':
        overall_summary = 'Yüksek risk profili tespit edildi. Aşağıdaki adımları öncelik sırasına göre uygulamak risk puanınızı düşürebilir.'
        overall_advice = ['Öncelik 1: Gecikmeli tüm ödemeleri hemen güncelleyin.', 'Öncelik 2: Kredi kartı bakiyelerini limitin %30\'unun altına düşürün.', 'Öncelik 3: Yeni borçlanmadan kaçının.']
    elif risk_level == 'medium':
        overall_summary = 'Orta düzey risk profili tespit edildi. Bazı alanlarda iyileştirme yaparak risk puanınızı düşürebilirsiniz.'
        overall_advice = ['Ödeme disiplinini koruyun — tek bir gecikme bile puanı düşürebilir.', 'Borç/gelir oranınızı %35\'in altında tutmaya çalışın.']
    else:
        overall_summary = 'Düşük risk profili — finansal durumunuz sağlıklı görünüyor. Mevcut disiplini korumaya devam edin.'
        overall_advice = ['Mevcut ödeme düzeninizi korumaya devam edin.', 'Kredi puanınızı periyodik olarak kontrol edin.']

    recommendations_data = {
        "riskFactors": risk_factors,
        "positiveFactors": positive_factors,
        "overallSummary": overall_summary,
        "overallAdvice": overall_advice,
        "riskLevel": risk_level,
        "totalRiskFactors": len(risk_factors),
        "totalPositiveFactors": len(positive_factors)
    }

    return {
        "explanations": explanations,
        "summary": short_summary,
        "xai_advice": xai_advice,
        "risk_level": risk_level,
        "recommendations": recommendations_data
    }

def get_shap_values(model, input_array):
    shap_results = []
    try:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(input_array)
        if isinstance(shap_values, list):
            vals = shap_values[1][0] 
        elif hasattr(shap_values, "shape"):
            vals = shap_values[0, :, 1] if len(shap_values.shape) == 3 else shap_values[0]
        else:
            vals = shap_values[0]
            
        vals = np.array(vals).flatten()
        for i, val in enumerate(vals):
            if i >= len(FEATURE_NAMES): break
            fname = FEATURE_NAMES[i]
            label = FEATURE_LABELS_TR.get(fname, fname)
            if abs(float(val)) > 0.001:
                shap_results.append({"feature": label, "value": float(val)})
        shap_results.sort(key=lambda x: abs(x["value"]), reverse=True)
    except Exception as e:
        pass
    return shap_results