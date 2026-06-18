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
        return {
            "text": "Merhaba! Size özel finansal tavsiyeler verebilmem için öncelikle güncel finansal bilgilerinizi girmeniz gerekiyor.",
            "action": {"label": "Yeni Analiz Yap", "route": "Form"}
        }

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
            return {"text": f"Şu anki risk oranınız yüksek (%{(risk_prob*100):.1f}). Sistem verilerinize göre yeni bir kredi çekmeniz oldukça riskli görünüyor. Lütfen öncelikle mevcut borçlarınızı (varsa gecikmelerinizi) azaltmaya odaklanın."}
        elif risk_prob > 0.3:
            return {"text": f"Risk oranınız orta seviyede (%{(risk_prob*100):.1f}). Kredi çekebilirsiniz ancak aylık taksitlerin, aylık gelirinizin %30'unu geçmemesine çok dikkat edin."}
        else:
            return {"text": f"Risk oranınız oldukça düşük (%{(risk_prob*100):.1f})! Finansal sağlığınız mükemmel görünüyor. Yeni bir kredi başvurusu yapmanızda herhangi bir sakınca bulunmuyor, muhtemelen kolayca onaylanacaktır."}

    elif any(word in msg_lower for word in ["kredi kartı", "kart", "kredi kartım"]):
        return {"text": "Kredi kartı borçluluk oranınızı düşük tutmak kredi notunuz için kritiktir. Limitinizin %30'undan fazlasını kullanmamaya çalışın. Asgari ödeme yerine her ay borcun tamamını kapatmak en iyi stratejidir."}

    elif any(word in msg_lower for word in ["risk", "not", "skor", "puan"]):
        if risk_level == "low":
            return {"text": f"Son analizimize göre risk olasılığınız sadece %{(risk_prob*100):.1f}. Kredi notunuz ve finansal güvenilirliğiniz harika durumda. Böyle devam edin!"}
        elif risk_level == "medium":
            return {"text": f"Son analizimize göre risk olasılığınız %{(risk_prob*100):.1f} (Orta Seviye). Finansal durumunuz fena değil ancak ufak tefek gecikmelere veya yüksek kredi kartı kullanımlarına dikkat etmelisiniz."}
        else:
            return {"text": f"Son analizimize göre risk olasılığınız maalesef yüksek (%{(risk_prob*100):.1f}). Finansal kuruluşlar size kredi verirken temkinli yaklaşacaktır. Borç yapılandırması düşünebilirsiniz."}

    elif any(word in msg_lower for word in ["gecikme", "ödemedim", "geciken"]):
        return {"text": "Gecikmeler (özellikle 30 gün ve üzeri) kredi notunu en hızlı düşüren faktördür. Algoritmamız gecikmeleri 'kırmızı bayrak' olarak değerlendirir. Lütfen tüm ödemelerinizi otomatik talimata alın."}

    elif any(word in msg_lower for word in ["gelir", "maaş", "zam"]):
        income = features.get("MonthlyIncome", "Bilinmiyor")
        return {"text": f"Sistemimizde kayıtlı son aylık geliriniz: {income} ₺. Gelirinizin artması tek başına riskinizi sıfırlamaz, önemli olan 'Borç/Gelir' (Debt Ratio) oranınızı düşük tutmaktır."}

    elif any(word in msg_lower for word in ["merhaba", "selam", "hey", "nasılsın"]):
        return {"text": f"Merhaba! Ben sizin kişisel Finansal Risk Yapay Zeka Asistanınızım. Güncel risk olasılığınız %{(risk_prob*100):.1f}. Size nasıl yardımcı olabilirim?"}
        
    elif any(word in msg_lower for word in ["teşekkür", "sağol", "eyvallah"]):
        return {"text": "Rica ederim! Finansal sağlığınızı korumak için buradayım. Başka bir sorunuz olursa sormaktan çekinmeyin."}

    # Yeni Deep Linking ve Uygulama Navigasyon Özellikleri
    elif any(word in msg_lower for word in ["analiz yap", "yeni analiz", "test et", "analize", "hesapla"]):
        return {
            "text": "Tabii, finansal durumunuzu değerlendirmek için yeni bir analiz başlatabilirsiniz. Lütfen aşağıdaki butona tıklayarak formu doldurun.",
            "action": {"label": "Yeni Analiz Yap", "route": "Form"}
        }
        
    elif any(word in msg_lower for word in ["geçmiş", "eski", "önceki", "history", "tarihçe"]):
        return {
            "text": "Geçmişte yaptığınız tüm analiz sonuçlarınıza detaylıca göz atabilirsiniz. Kısayolu aşağıya bırakıyorum:",
            "action": {"label": "Geçmiş Analizlerim", "route": "History"}
        }
        
    elif any(word in msg_lower for word in ["çıkış", "logout", "kapat", "hesabımdan çık"]):
        return {
            "text": "Güvenliğiniz için uygulamadan çıkış yapabilirsiniz:",
            "action": {"label": "Çıkış Yap", "route": "Logout"} # Frontend'de Logout özel işlenecek
        }
        
    elif any(word in msg_lower for word in ["ayarlar", "profil", "şifre"]):
        return {
            "text": "Profil ve güvenlik ayarlarınıza buradan ulaşabilirsiniz:",
            "action": {"label": "Ayarlar", "route": "Settings"}
        }

    else:
        return {"text": "Bu sorunuzu tam olarak anlayamadım. Bana 'Kredi çekmeli miyim?', 'Risk durumum nasıl?', 'Yeni analiz yap' veya 'Geçmiş analizlerim' gibi komutlar verebilirsiniz."}
