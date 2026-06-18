import json
import re

def generate_chatbot_response(message, user_analysis):
    """
    Kural tabanlı (Rule-based) Chatbot mantığı.
    message: Kullanıcının yazdığı mesaj
    user_analysis: Veritabanından çekilen kullanıcının son analiz verisi (dict)
                   Format: {'risk_probability': 0.85, 'risk_level': 'high', 'features_json': '{...}'}
    """
    msg_lower = message.lower()
    
    if not user_analysis:
        return "Merhaba! Size özel finansal tavsiyeler verebilmem için öncelikle sol taraftaki menüden 'Yeni Analiz Yap' ekranına giderek güncel finansal bilgilerinizi girmeniz gerekiyor."

    # Parse features
    try:
        features = json.loads(user_analysis.get('features_json', '{}'))
    except:
        features = {}

    risk_prob = user_analysis.get('risk_probability', 0)
    risk_level = user_analysis.get('risk_level', 'unknown')
    
    # Kredi/Borç/Limit Keywords
    if any(word in msg_lower for word in ["kredi çek", "kredi al", "kredi başvurusu", "kredi limiti", "yeni kredi"]):
        if risk_prob > 0.6:
            return f"Şu anki risk oranınız yüksek (%{(risk_prob*100):.1f}). Sistem verilerinize göre yeni bir kredi çekmeniz oldukça riskli görünüyor. Lütfen öncelikle mevcut borçlarınızı (varsa gecikmelerinizi) azaltmaya odaklanın."
        elif risk_prob > 0.3:
            return f"Risk oranınız orta seviyede (%{(risk_prob*100):.1f}). Kredi çekebilirsiniz ancak aylık taksitlerin, aylık gelirinizin %30'unu geçmemesine çok dikkat edin."
        else:
            return f"Risk oranınız oldukça düşük (%{(risk_prob*100):.1f})! Finansal sağlığınız mükemmel görünüyor. Yeni bir kredi başvurusu yapmanızda herhangi bir sakınca bulunmuyor, muhtemelen kolayca onaylanacaktır."

    elif any(word in msg_lower for word in ["kredi kartı", "kart", "kredi kartım"]):
        return "Kredi kartı borçluluk oranınızı düşük tutmak kredi notunuz için kritiktir. Limitinizin %30'undan fazlasını kullanmamaya çalışın. Asgari ödeme yerine her ay borcun tamamını kapatmak en iyi stratejidir."

    elif any(word in msg_lower for word in ["risk", "not", "skor", "puan"]):
        if risk_level == "low":
            return f"Son analizimize göre risk olasılığınız sadece %{(risk_prob*100):.1f}. Kredi notunuz ve finansal güvenilirliğiniz harika durumda. Böyle devam edin!"
        elif risk_level == "medium":
            return f"Son analizimize göre risk olasılığınız %{(risk_prob*100):.1f} (Orta Seviye). Finansal durumunuz fena değil ancak ufak tefek gecikmelere veya yüksek kredi kartı kullanımlarına dikkat etmelisiniz."
        else:
            return f"Son analizimize göre risk olasılığınız maalesef yüksek (%{(risk_prob*100):.1f}). Finansal kuruluşlar size kredi verirken temkinli yaklaşacaktır. Borç yapılandırması düşünebilirsiniz."

    elif any(word in msg_lower for word in ["gecikme", "ödemedim", "geciken"]):
        return "Gecikmeler (özellikle 30 gün ve üzeri) kredi notunu en hızlı düşüren faktördür. Algoritmamız gecikmeleri 'kırmızı bayrak' olarak değerlendirir. Lütfen tüm ödemelerinizi otomatik talimata alın."

    elif any(word in msg_lower for word in ["gelir", "maaş", "zam"]):
        income = features.get("MonthlyIncome", "Bilinmiyor")
        return f"Sistemimizde kayıtlı son aylık geliriniz: {income} ₺. Gelirinizin artması tek başına riskinizi sıfırlamaz, önemli olan 'Borç/Gelir' (Debt Ratio) oranınızı düşük tutmaktır."

    elif any(word in msg_lower for word in ["merhaba", "selam", "hey", "nasılsın"]):
        return f"Merhaba! Ben sizin kişisel Finansal Risk Yapay Zeka Asistanınızım. Güncel risk olasılığınız %{(risk_prob*100):.1f}. Size nasıl yardımcı olabilirim?"
        
    elif any(word in msg_lower for word in ["teşekkür", "sağol", "eyvallah"]):
        return "Rica ederim! Finansal sağlığınızı korumak için buradayım. Başka bir sorunuz olursa sormaktan çekinmeyin."

    else:
        return "Bu sorunuzu tam olarak anlayamadım. Bana 'Kredi çekmeli miyim?', 'Risk durumum nasıl?' veya 'Kredi kartı kullanımı' gibi konularda sorular sorabilirsiniz."
