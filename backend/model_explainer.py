"""
Explainable AI (XAI) Module
---------------------------
Provides feature importance, decision path, local explanation,
and SHAP values utilities for the trained risk model.
"""

import traceback
import numpy as np
import shap


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


# SHAP Explainer'ı bellekte tutmak için global değişken
_cached_explainer = None


def _safe_float(value, default=0.0):
    try:
        return float(value)
    except Exception:
        return default


def _get_feature_value(input_array, feature_name):
    try:
        idx = FEATURE_NAMES.index(feature_name)
        return _safe_float(input_array[0][idx])
    except Exception:
        return 0.0


def get_feature_importance(model):
    """
    Modelin global feature importance değerlerini döndürür.
    Bu değerler modelin genel davranışını gösterir.
    Tek bir kullanıcının SHAP açıklaması yerine kullanılmamalıdır.
    """
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
    """
    Random Forest içindeki ilk karar ağacına göre örnek karar yolunu döndürür.
    Bu çıktı açıklama amaçlıdır; nihai Random Forest kararı tüm ağaçların birleşimidir.
    """
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

    except Exception:
        traceback.print_exc()

    return steps


def get_shap_values(model, input_array):
    """
    Kullanıcının tekil analizine ait SHAP değerlerini üretir.
    Pozitif value: risk sınıfına katkıyı artırır.
    Negatif value: risk sınıfına katkıyı azaltır.
    """
    global _cached_explainer

    shap_results = []

    try:
        if _cached_explainer is None:
            print("⚙️ SHAP Explainer belleğe yükleniyor...")
            _cached_explainer = shap.TreeExplainer(model)

        shap_values = _cached_explainer.shap_values(input_array, check_additivity=False)

        if isinstance(shap_values, list):
            if len(shap_values) >= 2:
                vals = np.asarray(shap_values[1])[0]
            else:
                vals = np.asarray(shap_values[0])[0]

        elif hasattr(shap_values, "shape"):
            shap_values = np.asarray(shap_values)

            if shap_values.ndim == 3:
                # Beklenen yeni SHAP formatı: (sample, feature, class)
                if shap_values.shape[2] >= 2:
                    vals = shap_values[0, :, 1]
                else:
                    vals = shap_values[0, :, 0]

            elif shap_values.ndim == 2:
                vals = shap_values[0]

            else:
                vals = shap_values

        else:
            vals = np.asarray(shap_values).flatten()

        vals = np.asarray(vals).flatten()

        for i, val in enumerate(vals):
            if i >= len(FEATURE_NAMES):
                break

            fname = FEATURE_NAMES[i]
            label = FEATURE_LABELS_TR.get(fname, fname)
            current_value = _safe_float(input_array[0][i])
            shap_value = float(val)

            if abs(shap_value) > 0.001:
                shap_results.append({
                    "raw_feature": fname,
                    "feature": label,
                    "label": label,
                    "value": shap_value,
                    "current_value": current_value,
                    "direction": "increase" if shap_value > 0 else "decrease",
                })

        shap_results.sort(key=lambda x: abs(x["value"]), reverse=True)

    except Exception:
        traceback.print_exc()

    return shap_results


def _is_meaningful_risk_increasing_factor(shap_item, input_array):
    """
    SHAP değeri pozitif olsa bile ham değer 0 olan gecikme alanları
    risk artıran dominant faktör gibi yazılmamalıdır.

    Örnek:
    NumberOfTimes90DaysLate = 0 ise
    '90+ Gün Gecikme Sayısı riskinizi artıran dominant faktördür'
    denmemelidir.
    """
    raw_feature = shap_item.get("raw_feature")
    value = _get_feature_value(input_array, raw_feature)

    if shap_item.get("value", 0) <= 0:
        return False

    if raw_feature == "NumberOfTimes90DaysLate":
        return value > 0

    if raw_feature == "NumberOfTime60-89DaysPastDueNotWorse":
        return value > 0

    if raw_feature == "NumberOfTime30-59DaysPastDueNotWorse":
        return value > 0

    if raw_feature == "RevolvingUtilizationOfUnsecuredLines":
        return value > 0.30

    if raw_feature == "DebtRatio":
        return value > 0.35

    if raw_feature == "age":
        return value < 26

    if raw_feature == "MonthlyIncome":
        return value < 3000

    if raw_feature == "NumberOfOpenCreditLinesAndLoans":
        return value > 10

    if raw_feature == "NumberOfDependents":
        return value >= 4

    if raw_feature == "NumberRealEstateLoansOrLines":
        return value > 2

    return True


def _select_dominant_risk_factor(shap_values_result, input_array):
    """
    Risk artıran dominant faktörü kullanıcının kendi SHAP sonucundan seçer.
    Global feature importance kullanılmaz.
    """
    if not shap_values_result:
        return None

    positive_items = [
        item for item in shap_values_result
        if _is_meaningful_risk_increasing_factor(item, input_array)
    ]

    if not positive_items:
        return None

    return max(positive_items, key=lambda x: x["value"])


def _select_strongest_positive_factor(shap_values_result):
    """
    Düşük riskli kullanıcıda riski azaltan en güçlü değişkeni seçer.
    """
    if not shap_values_result:
        return None

    negative_items = [
        item for item in shap_values_result
        if item.get("value", 0) < 0
    ]

    if not negative_items:
        return None

    return min(negative_items, key=lambda x: x["value"])


def generate_local_explanation(
    model,
    input_array,
    feature_importances,
    prediction_proba,
    user_name=None,
    shap_values_result=None
):
    """
    Kullanıcının tekil analiz sonucu için açıklama ve öneri üretir.

    Önemli:
    - Dominant faktör global feature_importance üzerinden seçilmez.
    - Dominant faktör, o kullanıcıya ait pozitif SHAP değerleri içinden seçilir.
    - 90+ gün gecikme 0 ise açıklamada risk artıran dominant faktör olarak yazılmaz.
    """
    explanations = []

    input_array = np.asarray(input_array)
    risk_prob = float(prediction_proba)

    if risk_prob >= 0.7:
        risk_level = "high"
    elif risk_prob >= 0.4:
        risk_level = "medium"
    else:
        risk_level = "low"

    if shap_values_result is None:
        shap_values_result = get_shap_values(model, input_array)

    dominant_risk_factor = _select_dominant_risk_factor(shap_values_result, input_array)
    strongest_positive_factor = _select_strongest_positive_factor(shap_values_result)

    xai_advice = f"Sayın {user_name}, " if user_name else ""

    if risk_prob >= 0.7:
        xai_advice += (
            f"Yapay zeka modelimiz, girdiğiniz veriler doğrultusunda finansal profilinizi "
            f"%{int(risk_prob * 100)} ihtimalle 'Yüksek Riskli' olarak sınıflandırmıştır. "
        )
    elif risk_prob >= 0.4:
        xai_advice += (
            f"Yapay zeka modelimiz, finansal profilinizi "
            f"%{int(risk_prob * 100)} ihtimalle 'Orta Riskli' olarak değerlendirmiştir. "
        )
    else:
        xai_advice += (
            f"Sistemimiz finansal durumunuzu sağlıklı bularak "
            f"%{int(risk_prob * 100)} risk skoru ile 'Düşük Risk' kategorisine yerleştirmiştir. "
        )

    cc_util_val = _safe_float(input_array[0][0])
    age_val = _safe_float(input_array[0][1])
    late30_val = _safe_float(input_array[0][2])
    debt_ratio_val = _safe_float(input_array[0][3])
    late90_val = _safe_float(input_array[0][6])
    late60_val = _safe_float(input_array[0][8])

    details = []

    if late90_val > 0:
        details.append(f"90 gün üzeri ödeme gecikmeniz ({int(late90_val)} kez)")

    if late60_val > 0:
        details.append(f"60-89 gün arası ödeme gecikmeniz ({int(late60_val)} kez)")

    if late30_val > 0:
        details.append(f"30-59 gün arası ödeme gecikmeniz ({int(late30_val)} kez)")

    if cc_util_val > 0.5:
        details.append(
            f"kredi kartı limitlerinizin büyük kısmını kullanmanız "
            f"(doluluk: %{int(cc_util_val * 100)})"
        )

    if debt_ratio_val > 0.4:
        details.append(
            f"gelirinize kıyasla yüksek olan borç yükünüz "
            f"(oran: %{int(debt_ratio_val * 100)})"
        )

    if age_val < 26 and risk_prob >= 0.4:
        details.append(f"henüz tam oturmamış kredi geçmişiniz (yaş: {int(age_val)})")

    if details:
        if risk_prob >= 0.4:
            xai_advice += (
                f"Özellikle {', '.join(details)} bu skorun yükselmesindeki "
                f"temel nedenler arasında yer almaktadır. "
            )
        else:
            xai_advice += (
                f"Bununla birlikte, {', '.join(details)} gibi faktörlere "
                f"dikkat etmeniz faydalı olacaktır. "
            )

    elif risk_prob < 0.4:
        xai_advice += (
            "Düzenli ödeme geçmişiniz ve limitlerinizi dengeli kullanmanız "
            "bu olumlu skoru destekleyen güçlü faktörlerdir. "
        )

    if risk_prob >= 0.4:
        if dominant_risk_factor:
            top_feature_label = dominant_risk_factor.get("label") or dominant_risk_factor.get("feature")

            xai_advice += (
                f"SHAP (Açıklanabilir Yapay Zeka) analizine göre, bu analiz özelinde "
                f"riskinizi artıran en baskın faktör '{top_feature_label}' olarak tespit edilmiştir."
            )
        else:
            xai_advice += (
                "SHAP (Açıklanabilir Yapay Zeka) analizine göre, bu analiz özelinde "
                "tek başına baskın bir risk artırıcı faktör tespit edilmemiştir."
            )
    else:
        if strongest_positive_factor:
            top_feature_label = strongest_positive_factor.get("label") or strongest_positive_factor.get("feature")

            xai_advice += (
                f"SHAP analizine göre, profilinizi en çok güçlendiren özellik "
                f"'{top_feature_label}' değişkenidir."
            )
        else:
            xai_advice += (
                "SHAP analizine göre, genel finansal profiliniz düşük risk sonucunu desteklemektedir."
            )

    for item in shap_values_result[:5]:
        label = item.get("label") or item.get("feature")
        value = item.get("value", 0)

        if value > 0:
            desc = f"{label} değişkeni bu analizde risk skorunu artırıcı yönde etki etmiştir."
        else:
            desc = f"{label} değişkeni bu analizde risk skorunu azaltıcı yönde etki etmiştir."

        explanations.append({
            "feature": label,
            "value": round(float(value), 5),
            "direction": "increase" if value > 0 else "decrease",
            "description": desc,
        })

    if risk_prob >= 0.7:
        short_summary = "⚠️ Yüksek risk profili tespit edildi. Ana risk faktörlerini aşağıdan detaylıca inceleyebilirsiniz."
    elif risk_prob >= 0.4:
        short_summary = "⚡ Orta düzey risk profili. Bazı finansal göstergeleriniz yakın takip gerektiriyor."
    else:
        short_summary = "✅ Düşük risk profili. Finansal durumunuz genel standartlara göre sağlıklı görünüyor."

    risk_factors = []
    positive_factors = []

    # 1. Kredi Kartı Kullanım Oranı
    cc_util = cc_util_val

    if cc_util > 0.7:
        target_reduction = int((cc_util - 0.30) * 100)

        risk_factors.append({
            "feature": "Kredi Kartı Kullanım Oranı",
            "icon": "",
            "severity": "critical",
            "currentValue": f"%{int(cc_util * 100)}",
            "idealRange": "%0 – %30",
            "status": "Çok Yüksek",
            "explanation": (
                f"Kredi kartlarınızın %{int(cc_util * 100)}'i dolu. "
                f"Kredi limitinizin %30'undan fazlasını kullanmak, "
                f"finansal baskı altında olduğunuz izlenimini verir."
            ),
            "advice": [
                f"Hedef: Güvenilir seviyeye inmek için kredi kartı borcunuzun en az "
                f"%{target_reduction}'lik kısmını acilen kapatmalısınız.",
                "En yüksek faizli karttan başlayarak borçları ödeyin.",
                "Yeni alışverişlerde banka kartı kullanmayı tercih edin.",
            ],
        })

    elif cc_util > 0.3:
        target_reduction = int((cc_util - 0.30) * 100)

        risk_factors.append({
            "feature": "Kredi Kartı Kullanım Oranı",
            "icon": "",
            "severity": "warning",
            "currentValue": f"%{int(cc_util * 100)}",
            "idealRange": "%0 – %30",
            "status": "Orta",
            "explanation": (
                f"Kredi kartı kullanım oranınız %{int(cc_util * 100)}. "
                f"Kabul edilebilir seviyede ancak %30'un altına düşürmek "
                f"risk puanınızı olumlu etkileyebilir."
            ),
            "advice": [
                f"Hedef: Risk puanınızı iyileştirmek için kart borcunuzun "
                f"%{target_reduction}'lik kısmını kapatmalısınız."
            ],
        })

    else:
        positive_factors.append({
            "feature": "Kredi Kartı Kullanım Oranı",
            "icon": "",
            "currentValue": f"%{int(cc_util * 100)}",
            "message": "Kredi kartı kullanım oranınız sağlıklı seviyede. Bu, risk puanınızı olumlu etkiliyor.",
        })

    # 2. Yaş
    age = age_val

    if age < 25:
        risk_factors.append({
            "feature": "Yaş & Kredi Geçmişi",
            "icon": "",
            "severity": "info",
            "currentValue": f"{int(age)} yaş",
            "idealRange": "30+ yaş",
            "status": "Genç Profil",
            "explanation": (
                f"{int(age)} yaşındasınız. Genç yaş, kısa kredi geçmişi anlamına gelebilir. "
                f"Finans kuruluşları daha uzun kredi geçmişi olan bireyleri daha güvenilir bulabilir."
            ),
            "advice": [
                "Kredi geçmişinizi erken oluşturmak için düzenli ve küçük miktarlı kredi kullanın.",
                "Tüm faturalarınızı zamanında ödeyerek olumlu bir ödeme geçmişi oluşturun.",
            ],
        })

    elif 25 <= age <= 60:
        positive_factors.append({
            "feature": "Yaş & Kredi Geçmişi",
            "icon": "",
            "currentValue": f"{int(age)} yaş",
            "message": "Yaşınız, yeterli kredi geçmişi oluşturmak için uygun bir aralıkta.",
        })

    # 3. Gecikme Sayıları
    late30 = late30_val
    late60 = late60_val
    late90 = late90_val
    total_late = late30 + late60 + late90

    if late90 > 0:
        risk_factors.append({
            "feature": "Ciddi Ödeme Gecikmeleri (90+ Gün)",
            "icon": "",
            "severity": "critical",
            "currentValue": f"{int(late90)} kez",
            "idealRange": "0 kez",
            "status": "Kritik",
            "explanation": (
                f"Son 2 yılda {int(late90)} kez 90 günden fazla ödeme gecikmesi yaşanmış. "
                f"Bu durum kredi riskini en çok artıran faktörlerden biridir."
            ),
            "advice": [
                "Mevcut tüm gecikmeli ödemelerinizi acilen güncelleyin.",
                "Otomatik ödeme talimatı kurarak gelecekteki gecikmeleri önleyin.",
            ],
        })

    if late60 > 0:
        risk_factors.append({
            "feature": "60-89 Gün Gecikme",
            "icon": "⚠️",
            "severity": "warning",
            "currentValue": f"{int(late60)} kez",
            "idealRange": "0 kez",
            "status": "Uyarı",
            "explanation": (
                f"{int(late60)} kez 60-89 gün arası ödeme gecikmesi tespit edildi. "
                f"Bu tür gecikmeler kredi riskini olumsuz etkileyebilir."
            ),
            "advice": [
                "Tüm fatura ve kredi ödemeleriniz için otomatik ödeme kurun."
            ],
        })

    if late30 > 0:
        risk_factors.append({
            "feature": "30-59 Gün Gecikme",
            "icon": "⏰",
            "severity": "warning",
            "currentValue": f"{int(late30)} kez",
            "idealRange": "0 kez",
            "status": "Dikkat",
            "explanation": (
                f"{int(late30)} kez 30-59 gün arası ödeme gecikmesi yaşanmış. "
                f"Her gecikme kredi riskini olumsuz etkileyebilir."
            ),
            "advice": [
                "Ödeme hatırlatıcıları kurun.",
                "Telefon bildirimi veya takvim uyarısı kullanın.",
            ],
        })

    if total_late == 0:
        positive_factors.append({
            "feature": "Ödeme Geçmişi",
            "icon": "✅",
            "currentValue": "0 gecikme",
            "message": "Hiç ödeme gecikmesi yok. Güçlü ödeme disiplini risk puanınızı olumlu etkiliyor.",
        })

    # 4. Borç/Gelir Oranı
    debt_ratio = debt_ratio_val
    monthly_income = _safe_float(input_array[0][4])
    monthly_debt = debt_ratio * monthly_income

    if debt_ratio > 0.5:
        target_debt = 0.35 * monthly_income
        reduction_needed = max(monthly_debt - target_debt, 0)

        risk_factors.append({
            "feature": "Borç / Gelir Oranı",
            "icon": "",
            "severity": "critical" if debt_ratio > 0.8 else "warning",
            "currentValue": f"%{int(debt_ratio * 100)}",
            "idealRange": "%0 – %35",
            "status": "Çok Yüksek" if debt_ratio > 0.8 else "Yüksek",
            "explanation": (
                f"Aylık geliriniz {int(monthly_income):,} TL ve aylık borç ödemeleriniz "
                f"{int(monthly_debt):,} TL (%{int(debt_ratio * 100)} oran)."
            ).replace(",", "."),
            "advice": [
                (
                    f"Hedef: Güvenli bölge olan %35'e inmek için aylık borç yükünüzü "
                    f"yaklaşık {int(reduction_needed):,} TL azaltmalısınız."
                ).replace(",", "."),
                "En yüksek faizli borçları öncelikli olarak kapatın.",
            ],
        })

    elif debt_ratio > 0.35:
        target_debt = 0.35 * monthly_income
        reduction_needed = max(monthly_debt - target_debt, 0)

        risk_factors.append({
            "feature": "Borç / Gelir Oranı",
            "icon": "",
            "severity": "info",
            "currentValue": f"%{int(debt_ratio * 100)}",
            "idealRange": "%0 – %35",
            "status": "Dikkat",
            "explanation": (
                f"Aylık geliriniz {int(monthly_income):,} TL ve aylık borcunuz "
                f"{int(monthly_debt):,} TL (%{int(debt_ratio * 100)} oran)."
            ).replace(",", "."),
            "advice": [
                (
                    f"Hedef: Risk oranını iyileştirmek için borç yükünüzü "
                    f"yaklaşık {int(reduction_needed):,} TL azaltmalısınız."
                ).replace(",", ".")
            ],
        })

    else:
        positive_factors.append({
            "feature": "Borç / Gelir Oranı",
            "icon": "",
            "currentValue": f"%{int(debt_ratio * 100)}",
            "message": "Borç/gelir oranınız sağlıklı seviyede. Finansal durumunuz dengeli görünüyor.",
        })

    # 5. Aylık Gelir
    income = monthly_income

    if income < 3000:
        risk_factors.append({
            "feature": "Aylık Gelir",
            "icon": "",
            "severity": "warning",
            "currentValue": f"{int(income):,} ₺".replace(",", "."),
            "idealRange": "5.000+ ₺",
            "status": "Düşük",
            "explanation": (
                f"Aylık geliriniz {int(income):,} ₺ seviyesinde. "
                f"Düşük gelir, beklenmedik harcamalar karşısında mali dayanıklılığı azaltabilir."
            ).replace(",", "."),
            "advice": [
                "Acil durum fonu oluşturun.",
                "Gelir seviyenize uygun bir bütçe planı oluşturun.",
            ],
        })

    elif income >= 8000:
        positive_factors.append({
            "feature": "Aylık Gelir",
            "icon": "",
            "currentValue": f"{int(income):,} ₺".replace(",", "."),
            "message": "Aylık geliriniz yüksek seviyede. Bu, mali dayanıklılığınızı ve risk profilinizi olumlu etkiliyor.",
        })

    else:
        positive_factors.append({
            "feature": "Aylık Gelir",
            "icon": "",
            "currentValue": f"{int(income):,} ₺".replace(",", "."),
            "message": "Aylık geliriniz orta seviyede. Borçlarınızı yönetilebilir seviyede tutmaya devam edin.",
        })

    # 6. Açık Kredi Sayısı
    open_credits = _safe_float(input_array[0][5])

    if open_credits > 10:
        risk_factors.append({
            "feature": "Açık Kredi Sayısı",
            "icon": "",
            "severity": "warning",
            "currentValue": f"{int(open_credits)} adet",
            "idealRange": "3 – 7 adet",
            "status": "Yüksek",
            "explanation": (
                f"{int(open_credits)} adet açık kredi veya kredi kartınız var. "
                f"Çok sayıda açık hesap, aşırı borçlanma riskinin göstergesi olabilir."
            ),
            "advice": [
                "Kullanmadığınız kredi kartlarını kapatmayı değerlendirin."
            ],
        })

    # 7. Bakmakla Yükümlü Kişi
    dependents = _safe_float(input_array[0][9])

    if dependents >= 4:
        risk_factors.append({
            "feature": "Bakmakla Yükümlü Kişi Sayısı",
            "icon": "👨‍👩‍👧‍👦",
            "severity": "info",
            "currentValue": f"{int(dependents)} kişi",
            "idealRange": "Gelire orantılı",
            "status": "Yüksek Yük",
            "explanation": (
                f"{int(dependents)} kişiye bakmakla yükümlüsünüz. "
                f"Fazla bağımlı birey, sabit giderleri artırarak finansal esnekliği azaltabilir."
            ),
            "advice": [
                "Aile bütçesini detaylı planlayın ve takip edin.",
                "Acil durumlar için önceden birikim yapın.",
            ],
        })

    if risk_level == "high":
        overall_summary = (
            "Yüksek risk profili tespit edildi. "
            "Aşağıdaki adımları öncelik sırasına göre uygulamak risk puanınızı düşürebilir."
        )
        overall_advice = [
            "Öncelik 1: Gecikmeli tüm ödemeleri hemen güncelleyin.",
            "Öncelik 2: Kredi kartı bakiyelerini limitin %30'unun altına düşürün.",
            "Öncelik 3: Yeni borçlanmadan kaçının.",
        ]

    elif risk_level == "medium":
        overall_summary = (
            "Orta düzey risk profili tespit edildi. "
            "Bazı alanlarda iyileştirme yaparak risk puanınızı düşürebilirsiniz."
        )
        overall_advice = [
            "Ödeme disiplinini koruyun; tek bir gecikme bile risk skorunu olumsuz etkileyebilir.",
            "Borç/gelir oranınızı %35'in altında tutmaya çalışın.",
            "Kredi kartı kullanım oranınızı %30 seviyesinin altına indirmeyi hedefleyin.",
        ]

    else:
        overall_summary = (
            "Düşük risk profili. Finansal durumunuz sağlıklı görünüyor. "
            "Mevcut disiplini korumaya devam edin."
        )
        overall_advice = [
            "Mevcut ödeme düzeninizi korumaya devam edin.",
            "Kredi kartı kullanım oranınızı dengeli seviyede tutun.",
            "Kredi puanınızı periyodik olarak kontrol edin.",
        ]

    recommendations_data = {
        "riskFactors": risk_factors,
        "positiveFactors": positive_factors,
        "overallSummary": overall_summary,
        "overallAdvice": overall_advice,
        "riskLevel": risk_level,
        "totalRiskFactors": len(risk_factors),
        "totalPositiveFactors": len(positive_factors),
    }

    return {
        "explanations": explanations,
        "summary": short_summary,
        "xai_advice": xai_advice,
        "risk_level": risk_level,
        "recommendations": recommendations_data,
    }


