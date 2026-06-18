import json
import re

def generate_chatbot_response(message, user_analysis):
    """
    Gelişmiş Kural Tabanlı (Rule-based) Finansal Risk Yapay Zekası.
    message: Kullanıcının yazdığı mesaj
    user_analysis: Kullanıcının son analiz verisi
    """
    msg_lower = message.lower()
    
    # Uygulama hakkında genel sorular (Kullanıcı analiz yapmamış olsa bile cevaplanır)
    if any(word in msg_lower for word in ["uygulama", "nedir", "ne işe yarar", "nasıl çalışır", "sen kimsin", "amacınız"]):
        return {
            "text": "Ben Finansal Risk Yapay Zeka (AI) asistanınızım. Amacım, geliriniz, borçlarınız, yaşınız ve kredi geçmişiniz gibi finansal verilerinizi makine öğrenmesi modelleriyle analiz ederek, kredi çekme veya yeni borçlanma durumlarındaki riskinizi hesaplamaktır. Sizin için kişiselleştirilmiş finansal tavsiyeler üretebilirim."
        }

    if not user_analysis:
        return {
            "text": "Merhaba! Size özel, veriye dayalı finansal tavsiyeler verebilmem için öncelikle güncel finansal bilgilerinizi sisteme girmeniz gerekiyor. Aşağıdaki butondan ilk analizinizi hemen başlatabilirsiniz.",
            "action": {"label": "Yeni Analiz Yap", "route": "Form"}
        }

    # Kullanıcı verilerini ayrıştırma
    try:
        features = json.loads(user_analysis.get('features_json', '{}'))
    except:
        features = {}

    risk_prob = user_analysis.get('risk_probability', 0)
    risk_level = user_analysis.get('risk_level', 'unknown')
    
    income = float(features.get("MonthlyIncome", 0))
    debt = float(features.get("TotalDebt", 0))
    delinquencies = int(features.get("NumberOfTimes90DaysLate", 0) or 0)
    
    # Borç/Gelir Oranı (DTI) hesaplama
    dti = (debt / income) * 100 if income > 0 else 0

    # 1. TAVSİYE / ÖNERİ İSTEKLERİ
    if any(word in msg_lower for word in ["tavsiye", "öneri", "ne yapmalıyım", "nasıl düzeltirim", "fikrin nedir"]):
        if risk_prob > 0.6:
            advice = f"Mevcut verilerinize göre risk skorunuz yüksek (%{(risk_prob*100):.1f}). "
            if delinquencies > 0:
                advice += f"Sistemimizde {delinquencies} adet 90 günü aşmış gecikmeniz görünüyor. İlk önceliğiniz bu gecikmiş borçları kapatmak olmalıdır. "
            if dti > 40:
                advice += f"Aylık borç/gelir oranınız %{dti:.1f} seviyesinde; bu sınırın (%40) üzerinde. Acil durum fonu dışında yeni kredi çekmekten kesinlikle kaçınmalı ve harcamalarınızı kısmalısınız."
            return {"text": advice}
        elif risk_prob > 0.3:
            return {"text": f"Risk skorunuz orta seviyede (%{(risk_prob*100):.1f}). Borçluluk oranınız fena değil ancak iyileştirmeye açık. Kredi kartı asgari tutarlarını değil, dönem borçlarının tamamını ödemeye çalışın. Gerekmedikçe yeni kredi başvurusu (sorgusu) yapmayın."}
        else:
            return {"text": f"Mükemmel bir finansal tablo! Risk oranınız oldukça düşük (%{(risk_prob*100):.1f}). Düzenli ödeme alışkanlıklarınızı koruyun. Fazla nakdiniz varsa, bunu yatırım araçlarında değerlendirerek finansal özgürlüğünüzü hızlandırabilirsiniz."}

    # 2. KREDİ ÇEKME / BAŞVURU İSTEKLERİ
    elif any(word in msg_lower for word in ["kredi çek", "kredi al", "kredi başvurusu", "yeni kredi", "kredi çıkar mı", "kredi verirler mi"]):
        if risk_prob > 0.6 or dti > 50:
            return {"text": f"Algoritmamıza göre kredi başvurunuzun REDDEDİLME ihtimali çok yüksek (Risk: %{(risk_prob*100):.1f}). Bankalar, borç/gelir oranınızın yüksekliği nedeniyle yeni bir krediyi riskli bulacaktır. Şu an kredi çekmek yerine mevcut borçlarınızı konsolide etmeyi (tek bir çatı altında birleştirmeyi) düşünmelisiniz."}
        else:
            return {"text": f"Kredi çekmek için uygun bir profiliniz var (Risk: %{(risk_prob*100):.1f}). Ancak çekeceğiniz kredinin aylık taksiti ile mevcut borçlarınızın toplamı, aylık gelirinizin {income} TL'nin yarısını asla geçmemeli."}

    # 3. KREDİ KARTI / LİMİT İSTEKLERİ
    elif any(word in msg_lower for word in ["kredi kartı", "kart", "limit", "kredi kartım"]):
        return {"text": "Kredi kartı limitlerinizin tamamını kullanmak, kredi notunuzu hızla düşürür. İdeal olan, kart limitinizin %30'undan fazlasını doldurmamaktır. Eğer sürekli limite dayanıyorsanız, limit artırımı istemek yerine harcamaları kısmak veya nakit akışınızı düzenlemek daha güvenli bir yoldur."}

    # 4. RİSK / NOT / SKOR SORULARI
    elif any(word in msg_lower for word in ["risk", "not", "skor", "puan", "durumum"]):
        if risk_level == "low":
            return {"text": f"Son analizimize göre risk olasılığınız sadece %{(risk_prob*100):.1f}. Harika! Finansal kuruluşların gözünde çok 'güvenilir' bir sıradasınız."}
        elif risk_level == "medium":
            return {"text": f"Son analizimize göre risk olasılığınız %{(risk_prob*100):.1f} (Orta Seviye). Tehlikeli sularda değilsiniz ancak çok güvende de sayılmazsınız. Ani borçlanmalara dikkat edin."}
        else:
            return {"text": f"Son analizimize göre risk olasılığınız yüksek (%{(risk_prob*100):.1f}). Finansal kuruluşlar size borç verirken muhtemelen yüksek faiz uygulayacak veya reddedecektir."}

    # 5. GECİKME / BORÇ SORULARI
    elif any(word in msg_lower for word in ["gecikme", "ödemedim", "geciken", "borç", "icra"]):
        return {"text": "Bankalar için 30 günlük bir gecikme uyarıdır, ancak 90 günlük gecikme (idari takip) kredi sicilinizde yıllarca silinmeyen bir iz bırakır. Asla kredilerinizi yasal takip sürecine düşürmeyin; gerekirse bankayla görüşüp yapılandırma talep edin."}

    # 6. GELİR / MAAŞ SORULARI
    elif any(word in msg_lower for word in ["gelir", "maaş", "zam"]):
        return {"text": f"Sistemimizde kayıtlı aylık geliriniz: {income} ₺. Bankalar kredi verirken gelirinize değil, 'Gelirinizden arta kalan paraya' bakar. Yani maaşınız ne kadar yüksek olursa olsun, harcamalarınız ve borcunuz fazlaysa riskiniz yüksektir."}

    # 7. SELAMLAŞMA
    elif any(word in msg_lower for word in ["merhaba", "selam", "hey", "nasılsın"]):
        return {"text": f"Merhaba! Ben sizin Finansal Risk Yapay Zeka Asistanınızım. Güncel verilerinize göre risk oranınız %{(risk_prob*100):.1f}. 'Bana tavsiye ver', 'Kredi çekmeli miyim?' gibi uygulama içi asistanlık soruları sorabilirsiniz."}
        
    elif any(word in msg_lower for word in ["teşekkür", "sağol", "eyvallah", "harika"]):
        return {"text": "Rica ederim! Finansal sağlığınızı bir adım ileri taşımak için her zaman buradayım."}

    # 8. DEEP LINKING (UYGULAMA İÇİ YÖNLENDİRME)
    elif any(word in msg_lower for word in ["analiz", "test", "hesapla", "değerlendir"]):
        return {
            "text": "Güncel durumunuzu hesaplamak ve risk algoritmamızı çalıştırmak için yeni bir analiz yapabilirsiniz. Aşağıdaki butonu kullanarak forma gidebilirsiniz:",
            "action": {"label": "Yeni Analiz Yap", "route": "Form"}
        }
        
    elif any(word in msg_lower for word in ["geçmiş", "eski", "önceki", "history", "tarihçe"]):
        return {
            "text": "Zaman içindeki finansal trendinizi görmek için geçmiş analiz sonuçlarınıza göz atabilirsiniz:",
            "action": {"label": "Geçmiş Analizlerim", "route": "History"}
        }
        
    elif any(word in msg_lower for word in ["çıkış", "logout", "kapat", "hesabımdan çık"]):
        return {
            "text": "Oturumunuzu güvenle sonlandırabilirsiniz:",
            "action": {"label": "Çıkış Yap", "route": "Logout"}
        }
        
    elif any(word in msg_lower for word in ["ayarlar", "profil", "şifre"]):
        return {
            "text": "Uygulama ayarları, tema seçenekleri ve profil bilgilerinizi buradan yönetebilirsiniz:",
            "action": {"label": "Ayarlar", "route": "Settings"}
        }

    # FALLBACK (Anlaşılamayan Sorular)
    else:
        return {
            "text": "Özür dilerim, bu sorunuzu finansal algoritmamla eşleştiremedim. Bir Finansal Risk Yapay Zekası olarak bana:\n- 'Bana tavsiye ver'\n- 'Kredi çekmeli miyim?'\n- 'Risk durumum nasıl?'\n- 'Uygulama ne işe yarar?'\ngibi sorular sorabilirsiniz."
        }
