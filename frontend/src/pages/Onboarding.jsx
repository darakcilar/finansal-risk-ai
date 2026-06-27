import { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const slides = [
  {
    id: 1,
    title: 'Finansal Geleceğinizi\nŞekillendirin',
    desc: 'Yapay zeka destekli altyapımızla risk analizinizi saniyeler içinde yapın.',
    icon: '🚀'
  },
  {
    id: 2,
    title: 'Detaylı ve Anlaşılır\nRaporlar',
    desc: 'Karmaşık finansal verileri Explainable AI (XAI) ile anlaşılır grafiklere dönüştürüyoruz.',
    icon: '📊'
  },
  {
    id: 3,
    title: 'Kişiselleştirilmiş\nÖneriler',
    desc: 'Analiz sonucunuza özel iyileştirme tavsiyeleriyle finansal sağlığınızı koruyun.',
    icon: '💡'
  }
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { completeOnboarding } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      completeOnboarding();
      navigate('/dashboard');
    }
  };

  return (
    <div className="onboarding-container">
      <div style={{ zIndex: 10, maxWidth: '500px', width: '100%' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="onboarding-icon">
              {slides[currentSlide].icon}
            </div>
            
            <h1 className="onboarding-title" style={{ whiteSpace: 'pre-line' }}>
              {slides[currentSlide].title}
            </h1>
            
            <p className="onboarding-desc">
              {slides[currentSlide].desc}
            </p>
          </motion.div>
        </AnimatePresence>

        <div>
          <div className="onboarding-dots">
            {slides.map((_, idx) => (
              <div 
                key={idx} 
                className={`onboarding-dot ${currentSlide === idx ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
              />
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            className="auth-btn"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 auto', maxWidth: '300px' }}
          >
            <span>{currentSlide === slides.length - 1 ? 'Hemen Başla' : 'İleri'}</span>
            <ChevronRight size={20} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
