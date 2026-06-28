import json
import re
import unicodedata


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


def _normalize_text(text):
    """
    Türkçe karakterleri koruyarak daha esnek eşleşme yapabilmek için
    metni küçük harfe çevirir ve fazla boşlukları temizler.
    """
    if not text:
        return ""

    text = str(text).lower().strip()
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"\s+", " ", text)

    return text


def _contains_any(message, keywords):
    message = _normalize_text(message)

    return any(keyword in message for keyword in keywords)


def _safe_float(value, default=0.0):
    try:
        if value is None or value == "":
            return default

        return float(value)

    except Exception:
        return default


def _safe_int(value, default=0):
    try:
        if value is None or value == "":
            return default

        return int(float(value))

    except Exception:
        return default


def _format_percent(value):
    try:
        return f"%{float(value) * 100:.1f}"
    except Exception:
        return "%0.0"


def _format_tl(value):
    try:
        return f"{int(float(value)):,} TL".replace(",", ".")
    except Exception:
        return "0 TL"


def _parse_features(user_analysis):
    """
    user_analysis içindeki features_json alanını güvenli şekilde çözer.
    """
    if not user_analysis:
        return {}

    raw_features = user_analysis.get("features_json", "{}")

    if isinstance(raw_features, dict):
        return raw_features

    try:
        return json.loads(raw_features or "{}")

    except Exception:
        return {}


def _build_financial_profile(user_analysis):
    """
    Son analiz kaydından chatbot'un kullanacağı özet finansal profili çıkarır.
    """
    features = _parse_features(user_analysis)

    risk_probability = _safe_float(user_analysis.get("risk_probability", 0))
    risk_level = user_analysis.get("risk_level", "unknown")

    income = _safe_float(features.get("MonthlyIncome", 0))
    debt_ratio = _safe_float(features.get("DebtRatio", 0))
    cc_util = _safe_float(features.get("RevolvingUtilizationOfUnsecuredLines", 0))
    age = _safe_int(features.get("age", 0))

    late30 = _safe_int(features.get("NumberOfTime30-59DaysPastDueNotWorse", 0))
    late60 = _safe_int(features.get("NumberOfTime60-89DaysPastDueNotWorse", 0))
    late90 = _safe_int(features.get("NumberOfTimes90DaysLate", 0))

    open_credits = _safe_int(features.get("NumberOfOpenCreditLinesAndLoans", 0))
    real_estate = _safe_int(features.get("NumberRealEstateLoansOrLines", 0))
    dependents = _safe_int(features.get("NumberOfDependents", 0))

    monthly_debt = income * debt_ratio if income > 0 else 0
    total_late = late30 + late60 + late90

    return {
        "features": features,
        "risk_probability": risk_probability,
        "risk_level": risk_level,
        "income": income,
        "debt_ratio": debt_ratio,
        "cc_util": cc_util,
        "age": age,
        "late30": late30,
        "late60": late60,
        "late90": late90,
        "total_late": total_late,
        "open_credits": open_credits,
        "real_estate": real_estate,
        "dependents": dependents,
        "monthly_debt": monthly_debt,
    }


def _risk_label(risk_level, risk_probability):
    if risk_level == "high" or risk_probability >= 0.7:
        return "Yüksek Risk"

    if risk_level == "medium" or risk_probability >= 0.4:
        return "Orta Risk"

    if risk_level == "low" or risk_probability < 0.4:
        return "Düşük Risk"

    return "Belirsiz"


def _main_risk_reasons(profile):
    """
    Kullanıcıya özel risk nedenlerini çıkarır.
    Değer 0 ise o faktör risk nedeni olarak yazılmaz.
    """
    reasons = []

    if profile["late90"] > 0:
        reasons.append(
            f"90 gün üzeri gecikme sayınız {profile['late90']} olduğu için kredi riski ciddi şekilde artıyor"
        )

    if profile["late60"] > 0:
        reasons.append(
            f"60-89 gün arası gecikme sayınız {profile['late60']} olduğu için ödeme disiplini açısından uyarı oluşuyor"
        )

    if profile["late30"] > 0:
        reasons.append(
            f"30-59 gün arası gecikme sayınız {profile['late30']} olduğu için risk skorunuz olumsuz etkileniyor"
        )

    if profile["cc_util"] >= 0.70:
        reasons.append(
            f"kredi kartı kullanım oranınız {_format_percent(profile['cc_util'])} seviyesinde ve ideal sınır olan %30'un oldukça üzerinde"
        )

    elif profile["cc_util"] >= 0.30:
        reasons.append(
            f"kredi kartı kullanım oranınız {_format_percent(profile['cc_util'])}; daha güvenli görünüm için %30 altı hedeflenmeli"
        )

    if profile["debt_ratio"] >= 0.50:
        reasons.append(
            f"borç/gelir oranınız {_format_percent(profile['debt_ratio'])}; bu oran aylık gelirinizin büyük bölümünün borca gittiğini gösteriyor"
        )

    elif profile["debt_ratio"] >= 0.35:
        reasons.append(
            f"borç/gelir oranınız {_format_percent(profile['debt_ratio'])}; sınırda kabul edilebilecek bir seviyede"
        )

    if profile["income"] > 0 and profile["income"] < 3000:
        reasons.append(
            f"aylık geliriniz {_format_tl(profile['income'])}; düşük gelir beklenmedik giderlere karşı dayanıklılığı azaltabilir"
        )

    if profile["age"] > 0 and profile["age"] < 25:
        reasons.append(
            f"yaşınız {profile['age']}; genç profillerde kredi geçmişi genellikle daha kısa olduğu için model bunu temkinli değerlendirebilir"
        )

    if profile["open_credits"] > 10:
        reasons.append(
            f"açık kredi/kart sayınız {profile['open_credits']}; çok sayıda açık hesap risk algısını artırabilir"
        )

    if profile["dependents"] >= 4:
        reasons.append(
            f"bakmakla yükümlü olduğunuz kişi sayısı {profile['dependents']}; sabit gider yükünüzü artırabilir"
        )

    return reasons


def _positive_points(profile):
    positives = []

    if profile["late30"] == 0 and profile["late60"] == 0 and profile["late90"] == 0:
        positives.append("ödeme gecikmeniz bulunmaması güçlü bir olumlu faktör")

    if profile["cc_util"] < 0.30:
        positives.append("kredi kartı kullanım oranınızın %30 altında olması sağlıklı bir gösterge")

    if profile["debt_ratio"] < 0.35:
        positives.append("borç/gelir oranınızın güvenli aralıkta olması finansal dayanıklılığınızı destekliyor")

    if profile["income"] >= 8000:
        positives.append("aylık gelirinizin görece güçlü olması ödeme kapasitenizi olumlu etkiliyor")

    if 25 <= profile["age"] <= 60:
        positives.append("yaş aralığınız kredi geçmişi oluşumu açısından daha dengeli değerlendirilebilir")

    return positives


def _get_priority_actions(profile):
    actions = []

    if profile["late90"] > 0:
        actions.append("90 gün üzeri gecikmeleri öncelikli olarak kapatın veya yapılandırın.")

    if profile["late60"] > 0:
        actions.append("60-89 gün arası gecikmeleri tekrar etmemesi için otomatik ödeme talimatı oluşturun.")

    if profile["late30"] > 0:
        actions.append("30-59 gün gecikmeleri azaltmak için ödeme takvimi ve hatırlatıcı kullanın.")

    if profile["cc_util"] > 0.30:
        target_reduction = max(profile["cc_util"] - 0.30, 0)
        actions.append(
            f"Kredi kartı kullanım oranınızı %30 altına indirmek için yaklaşık %{target_reduction * 100:.0f} oranında kullanım azaltımı hedefleyin."
        )

    if profile["debt_ratio"] > 0.35:
        if profile["income"] > 0:
            target_debt = profile["income"] * 0.35
            reduction = max(profile["monthly_debt"] - target_debt, 0)

            actions.append(
                f"Borç/gelir oranını %35 seviyesine indirmek için aylık borç yükünüzü yaklaşık {_format_tl(reduction)} azaltmayı hedefleyin."
            )
        else:
            actions.append("Borç/gelir oranınızı %35 seviyesinin altına indirmeye çalışın.")

    if profile["open_credits"] > 10:
        actions.append("Kullanmadığınız kredi kartlarını veya gereksiz açık hesapları kapatmayı değerlendirin.")

    if not actions:
        actions.append("Mevcut ödeme disiplininizi koruyun ve yeni borçlanmalarda aylık ödeme gücünüzü aşmamaya dikkat edin.")

    return actions


def _answer_summary(profile):
    label = _risk_label(profile["risk_level"], profile["risk_probability"])
    reasons = _main_risk_reasons(profile)
    positives = _positive_points(profile)

    text = (
        f"Son analizine göre risk skorun {_format_percent(profile['risk_probability'])} "
        f"ve sistem seni '{label}' sınıfında değerlendiriyor.\n\n"
    )

    if reasons:
        text += "Risk skorunu etkileyen başlıca noktalar:\n"
        for reason in reasons[:5]:
            text += f"- {reason}.\n"

    if positives:
        text += "\nOlumlu görünen noktalar:\n"
        for positive in positives[:3]:
            text += f"- {positive}.\n"

    text += "\nBu sonuç kesin kredi kararı değildir; modelin finansal göstergelerine göre ürettiği karar destek yorumudur."

    return {"text": text}


def _answer_advice(profile):
    label = _risk_label(profile["risk_level"], profile["risk_probability"])
    actions = _get_priority_actions(profile)

    text = (
        f"Risk durumun: {label} ({_format_percent(profile['risk_probability'])}).\n\n"
        "Öncelik sırasına göre şunları yapmanı öneririm:\n"
    )

    for index, action in enumerate(actions[:5], start=1):
        text += f"{index}. {action}\n"

    text += (
        "\nKısa hedef: ödeme gecikmesini sıfırda tutmak, kredi kartı kullanımını %30 altına indirmek "
        "ve borç/gelir oranını %35 civarına çekmek."
    )

    return {"text": text}


def _answer_credit_decision(profile):
    risk_probability = profile["risk_probability"]
    debt_ratio = profile["debt_ratio"]
    late90 = profile["late90"]
    late60 = profile["late60"]

    if risk_probability >= 0.70 or debt_ratio >= 0.55 or late90 > 0:
        text = (
            f"Şu an yeni kredi başvurusu yapmak riskli görünüyor. "
            f"Risk skorun {_format_percent(risk_probability)}.\n\n"
            "Bankalar açısından özellikle borç/gelir oranı, ödeme gecikmeleri ve mevcut kredi yükü önemlidir. "
            "Önce gecikmeleri kapatıp borç/gelir oranını düşürmen daha mantıklı olur."
        )

    elif risk_probability >= 0.40 or debt_ratio >= 0.35 or late60 > 0:
        text = (
            f"Kredi başvurusu için durumun tamamen kötü değil; ancak temkinli ilerlemelisin. "
            f"Risk skorun {_format_percent(risk_probability)}.\n\n"
            "Yeni kredi taksiti eklendiğinde toplam aylık borç yükünün gelirinin %35-40 bandını aşmaması gerekir. "
            "Daha düşük tutarlı ve kısa vadeli seçenekler daha güvenli olabilir."
        )

    else:
        text = (
            f"Kredi başvurusu açısından profilin görece daha sağlıklı görünüyor. "
            f"Risk skorun {_format_percent(risk_probability)}.\n\n"
            "Yine de kredi tutarını gelirine göre sınırlı tutmalı, toplam aylık borç yükünü %35 civarında korumalısın."
        )

    return {"text": text}


def _answer_credit_card(profile):
    cc_util = profile["cc_util"]

    if cc_util >= 0.70:
        text = (
            f"Kredi kartı kullanım oranın {_format_percent(cc_util)}. Bu çok yüksek bir seviye.\n\n"
            "Model açısından bu durum finansal baskı işareti olarak görülür. "
            "Limit artırımı istemek yerine önce kart borcunu azaltman daha sağlıklı olur. "
            "Hedef kullanım oranı %30 altıdır."
        )

    elif cc_util >= 0.30:
        text = (
            f"Kredi kartı kullanım oranın {_format_percent(cc_util)}. Orta seviyede ama iyileştirilebilir.\n\n"
            "Risk skorunu düşürmek için kullanım oranını %30 altına indirmeyi hedefle. "
            "Asgari ödeme yerine mümkün olduğunca dönem borcunun tamamını kapat."
        )

    else:
        text = (
            f"Kredi kartı kullanım oranın {_format_percent(cc_util)}. Bu sağlıklı bir seviye.\n\n"
            "Bu alışkanlığı koruman risk skorunu olumlu etkiler. Limit artışı düşünüyorsan bile kullanım oranını düşük tutmaya devam et."
        )

    return {"text": text}


def _answer_debt(profile):
    debt_ratio = profile["debt_ratio"]
    income = profile["income"]
    monthly_debt = profile["monthly_debt"]

    text = (
        f"Borç/gelir oranın {_format_percent(debt_ratio)}.\n"
        f"Aylık gelir: {_format_tl(income)}\n"
        f"Tahmini aylık borç yükü: {_format_tl(monthly_debt)}\n\n"
    )

    if debt_ratio >= 0.50:
        text += (
            "Bu oran yüksek. Gelirinin büyük kısmı borç ödemesine gidiyor olabilir. "
            "Yeni borç almak yerine borç kapatma, yapılandırma veya harcama azaltma daha öncelikli."
        )

    elif debt_ratio >= 0.35:
        text += (
            "Bu oran sınırda. Daha güvenli bölge için %35 altı hedeflenmeli. "
            "Yeni kredi taksiti eklemeden önce mevcut borç yükünü azaltman iyi olur."
        )

    else:
        text += (
            "Bu oran sağlıklı kabul edilebilir. Yine de yeni borçlanmalarda bu oranı %35 seviyesinin altında tutmaya çalış."
        )

    return {"text": text}


def _answer_late_payment(profile):
    text = ""

    if profile["total_late"] == 0:
        text = (
            "Son analizine göre ödeme gecikmen görünmüyor. Bu çok olumlu bir durum.\n\n"
            "Ödeme disiplinini korumak için otomatik ödeme talimatı, takvim hatırlatıcısı ve acil durum bütçesi kullanabilirsin."
        )

    else:
        text = "Son analizinde görünen gecikme bilgileri:\n"

        if profile["late30"] > 0:
            text += f"- 30-59 gün gecikme: {profile['late30']} kez\n"

        if profile["late60"] > 0:
            text += f"- 60-89 gün gecikme: {profile['late60']} kez\n"

        if profile["late90"] > 0:
            text += f"- 90+ gün gecikme: {profile['late90']} kez\n"

        text += (
            "\nÖncelik, en uzun gecikmeleri kapatmak olmalı. "
            "90+ gün gecikmeler kredi riski açısından en ağır sinyallerden biridir. "
            "Daha sonra 60-89 ve 30-59 gün gecikmelerin tekrar etmemesi için ödeme planı oluşturmalısın."
        )

    return {"text": text}


def _answer_income(profile):
    income = profile["income"]
    debt_ratio = profile["debt_ratio"]

    text = (
        f"Sistemdeki aylık gelir bilgin: {_format_tl(income)}.\n"
        f"Borç/gelir oranın: {_format_percent(debt_ratio)}.\n\n"
    )

    if income <= 0:
        text += (
            "Gelir bilgisi eksik veya sıfır görünüyor. Daha doğru analiz için aylık gelir alanını gerçekçi şekilde girmen gerekir."
        )

    elif debt_ratio >= 0.50:
        text += (
            "Gelirin olsa bile borç yükün yüksek olduğu için model seni daha riskli değerlendirebilir. "
            "Bankalar yalnızca maaşa değil, maaştan borçlar çıktıktan sonra kalan ödeme gücüne de bakar."
        )

    elif debt_ratio < 0.35:
        text += (
            "Gelirine göre borç yükün daha dengeli görünüyor. Bu durum risk skorunu olumlu etkiler."
        )

    else:
        text += (
            "Gelir seviyen fena değil; ancak borç/gelir oranını biraz daha düşürmen risk profilini güçlendirebilir."
        )

    return {"text": text}


def _answer_what_if(profile, message):
    msg = _normalize_text(message)

    simulated_cc = profile["cc_util"]
    simulated_dti = profile["debt_ratio"]
    simulated_late30 = profile["late30"]
    simulated_late60 = profile["late60"]
    simulated_late90 = profile["late90"]

    if "kart" in msg or "limit" in msg:
        simulated_cc = 0.30

    if "borç" in msg or "borc" in msg:
        simulated_dti = 0.35

    if "gecikme" in msg:
        simulated_late30 = 0
        simulated_late60 = 0
        simulated_late90 = 0

    text = (
        "Basit What-If yorumu:\n\n"
        f"- Mevcut kredi kartı kullanımın: {_format_percent(profile['cc_util'])}\n"
        f"- Hedef kredi kartı kullanımı: {_format_percent(simulated_cc)}\n"
        f"- Mevcut borç/gelir oranı: {_format_percent(profile['debt_ratio'])}\n"
        f"- Hedef borç/gelir oranı: {_format_percent(simulated_dti)}\n"
        f"- Mevcut toplam gecikme: {profile['total_late']} kez\n"
        f"- Hedef toplam gecikme: {simulated_late30 + simulated_late60 + simulated_late90} kez\n\n"
        "Bu chatbot yaklaşık yorum üretir; kesin yeni risk skoru için What-If simülasyon ekranından veya yeni analiz formundan tekrar hesaplama yapmalısın."
    )

    return {
        "text": text,
        "action": {
            "label": "What-If / Yeni Analiz Yap",
            "route": "Form"
        }
    }


def _answer_app_help():
    return {
        "text": (
            "Ben Finansal Risk AI asistanıyım. Son analiz verilerine göre kredi riski, borç/gelir oranı, "
            "kredi kartı kullanımı, ödeme gecikmeleri ve finansal iyileştirme önerileri hakkında yorum yapabilirim.\n\n"
            "Bana şunları sorabilirsin:\n"
            "- Riskim neden yüksek?\n"
            "- Kredi çekmeli miyim?\n"
            "- Borç/gelir oranım nasıl?\n"
            "- Kredi kartı kullanımım riskli mi?\n"
            "- Gecikmelerim ne kadar etkiliyor?\n"
            "- Ne yaparsam riskim düşer?"
        )
    }


def _answer_no_analysis():
    return {
        "text": (
            "Sana kişisel ve veriye dayalı tavsiye verebilmem için önce güncel finansal analiz yapman gerekiyor. "
            "Analizden sonra risk skorunu, borç/gelir oranını, gecikmeleri ve kredi kartı kullanımını birlikte yorumlayabilirim."
        ),
        "action": {
            "label": "Yeni Analiz Yap",
            "route": "Form"
        }
    }


def _answer_navigation(message):
    if _contains_any(message, ["yeni analiz", "analiz yap", "hesapla", "test yap", "form"]):
        return {
            "text": "Yeni bir finansal risk analizi yapmak için analiz formuna gidebilirsin.",
            "action": {
                "label": "Yeni Analiz Yap",
                "route": "Form"
            }
        }

    if _contains_any(message, ["geçmiş", "onceki", "önceki", "history", "tarihçe"]):
        return {
            "text": "Geçmiş analizlerini inceleyerek risk durumunun zaman içinde nasıl değiştiğini görebilirsin.",
            "action": {
                "label": "Geçmiş Analizlerim",
                "route": "History"
            }
        }

    if _contains_any(message, ["ayar", "ayarlar", "profil", "şifre", "sifre"]):
        return {
            "text": "Profil, tema ve hesap ayarlarını buradan yönetebilirsin.",
            "action": {
                "label": "Ayarlar",
                "route": "Settings"
            }
        }

    if _contains_any(message, ["piyasa", "dolar", "euro", "kur", "faiz"]):
        return {
            "text": "Piyasa verilerini ve temel finansal göstergeleri görmek için piyasa ekranına gidebilirsin.",
            "action": {
                "label": "Piyasa Verileri",
                "route": "Market"
            }
        }

    return None


def generate_chatbot_response(message, user_analysis):
    """
    Finansal Risk AI için geliştirilmiş kural tabanlı akıllı asistan.

    Not:
    Bu yapı harici LLM API kullanmaz.
    Kullanıcının son analiz kaydını okuyarak kişiselleştirilmiş finansal yorum üretir.
    """
    msg = _normalize_text(message)

    if not msg:
        return {
            "text": "Mesajını anlayamadım. Bana risk durumun, kredi başvurusu, borç/gelir oranı veya kredi kartı kullanımı hakkında soru sorabilirsin."
        }

    navigation_answer = _answer_navigation(msg)

    if navigation_answer:
        return navigation_answer

    if _contains_any(msg, ["merhaba", "selam", "hey", "iyi misin", "nasılsın"]):
        if user_analysis:
            profile = _build_financial_profile(user_analysis)

            return {
                "text": (
                    f"Merhaba! Son analizine göre risk skorun {_format_percent(profile['risk_probability'])}. "
                    "Riskinin nedenlerini, kredi çekip çekmemen gerektiğini veya ne yaparsan riskinin düşeceğini sorabilirsin."
                )
            }

        return {
            "text": "Merhaba! Ben Finansal Risk AI asistanıyım. Kişisel yorum yapabilmem için önce finansal analiz oluşturman gerekiyor.",
            "action": {
                "label": "Yeni Analiz Yap",
                "route": "Form"
            }
        }

    if _contains_any(msg, ["teşekkür", "tesekkur", "sağ ol", "sagol", "eyvallah", "tamam"]):
        return {
            "text": "Rica ederim. Finansal riskini düşürmek için ödeme gecikmelerini sıfırda tutman, kart kullanımını %30 altında koruman ve borç/gelir oranını dengede tutman önemli."
        }

    if _contains_any(msg, ["uygulama", "nedir", "ne işe yarar", "nasil calisir", "nasıl çalışır", "sen kimsin", "amacın", "yardım", "yardim"]):
        return _answer_app_help()

    if not user_analysis:
        return _answer_no_analysis()

    profile = _build_financial_profile(user_analysis)

    if _contains_any(msg, ["neden", "niye", "riskim neden", "risk neden", "yüksek çıktı", "yuksek cikti", "orta çıktı", "orta cikti", "açıkla", "acikla", "sebep"]):
        return _answer_summary(profile)

    if _contains_any(msg, ["tavsiye", "öneri", "oneri", "ne yapmalıyım", "ne yapmaliyim", "nasıl düşürürüm", "nasil dusururum", "düzeltirim", "duzeltirim", "iyileştir", "iyilestir"]):
        return _answer_advice(profile)

    if _contains_any(msg, ["kredi çek", "kredi cek", "kredi al", "kredi başvurusu", "kredi basvurusu", "kredi çıkar mı", "kredi cikar mi", "kredi verirler mi", "başvuru yapayım mı", "basvuru yapayim mi"]):
        return _answer_credit_decision(profile)

    if _contains_any(msg, ["kredi kartı", "kredi karti", "kart", "limit", "limit artır", "limit artir", "kart borcu", "asgari"]):
        return _answer_credit_card(profile)

    if _contains_any(msg, ["borç", "borc", "borç/gelir", "borc/gelir", "dti", "aylık borç", "aylik borc", "borcum"]):
        return _answer_debt(profile)

    if _contains_any(msg, ["gecikme", "geciken", "ödemedim", "odemedim", "90 gün", "90 gun", "60 gün", "60 gun", "30 gün", "30 gun", "icra", "takip"]):
        return _answer_late_payment(profile)

    if _contains_any(msg, ["gelir", "maaş", "maas", "kazanç", "kazanc", "aylık gelir", "aylik gelir"]):
        return _answer_income(profile)

    if _contains_any(msg, ["what if", "what-if", "simülasyon", "simulasyon", "şunu yaparsam", "sunu yaparsam", "azaltırsam", "azaltirsam", "sıfırlarsam", "sifirlarsam", "düşürürsem", "dusurursem"]):
        return _answer_what_if(profile, msg)

    if _contains_any(msg, ["risk", "skor", "puan", "not", "durumum", "finansal durum"]):
        return _answer_summary(profile)

    return {
        "text": (
            "Bu soruyu finansal risk bağlamında tam eşleştiremedim. "
            "Ama son analiz verilerine göre şu konularda yardımcı olabilirim:\n\n"
            "- Riskim neden yüksek?\n"
            "- Kredi çekmeli miyim?\n"
            "- Borç/gelir oranım nasıl?\n"
            "- Kredi kartı kullanımım riskli mi?\n"
            "- Gecikmelerim riskimi nasıl etkiliyor?\n"
            "- Ne yaparsam riskim düşer?"
        )
    }