import html2pdf from 'html2pdf.js';

export const generateFullRiskReportPDF = (result, currentFeatures, reportDate = new Date()) => {
    let recHtmlBlocks = '';
    
    if (result.recommendations) {
      const recs = result.recommendations;
      
      if (recs.overallAdvice && recs.overallAdvice.length > 0) {
        recHtmlBlocks += `
          <div style="margin-bottom: 20px; page-break-inside: avoid;">
            <h3 style="color: #0f172a; font-size: 14px; margin-bottom: 8px;">📌 Genel Değerlendirme ve Eylem Planı</h3>
            <p style="font-size: 12px; color: #334155; margin-bottom: 8px; font-weight: bold;">${recs.overallSummary || ''}</p>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #475569; line-height: 1.6;">
              ${recs.overallAdvice.map(a => `<li style="margin-bottom: 4px;">${a}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      if (recs.riskFactors && recs.riskFactors.length > 0) {
        recHtmlBlocks += `<h3 style="color: #e11d48; font-size: 14px; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px dashed #fecdd3; padding-bottom: 5px; page-break-after: avoid;">⚠️ Öncelikli İyileştirme Alanları</h3>`;
        
        recs.riskFactors.forEach(rf => {
          const sev = String(rf.severity || '').toLowerCase().trim();
          let bgHex = '#fdf2f8'; 
          let borderHex = '#f43f5e';
          
          if (sev === 'warning') {
            bgHex = '#fffbeb'; 
            borderHex = '#f59e0b';
          } else if (sev === 'info') {
            bgHex = '#eef2ff'; 
            borderHex = '#3b82f6';
          }

          recHtmlBlocks += `
            <div style="margin-bottom: 15px; background: ${bgHex}; padding: 12px; border-left: 4px solid ${borderHex}; border-radius: 4px; page-break-inside: avoid;">
              <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 5px;">
                ${rf.icon || ''} ${rf.feature} <span style="color: #64748b; font-weight: normal; font-size: 11px;">(Mevcut Değer: ${rf.currentValue || ''})</span>
              </strong>
              <p style="font-size: 11px; color: #334155; margin: 0 0 8px 0; line-height: 1.5;">${rf.explanation}</p>
              <ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #475569; line-height: 1.5;">
                ${(rf.advice || []).map(a => `<li style="margin-bottom: 3px;">${a}</li>`).join('')}
              </ul>
            </div>
          `;
        });
      }
    }

    if (!recHtmlBlocks) {
      recHtmlBlocks = `<p style="font-size: 12px;">Finansal verilerinizi düzenli takip etmeye devam edin.</p>`;
    }

    const riskIncreasers = result.shap_values?.filter(s => s.value > 0).slice(0, 3) || [];
    const riskDecreasers = result.shap_values?.filter(s => s.value < 0).slice(0, 3) || [];

    let shapHtml = '';
    if (riskIncreasers.length > 0 || riskDecreasers.length > 0) {
      shapHtml = `
        <div style="page-break-inside: avoid;">
          <h2 style="color: #0f172a; font-size: 16px; margin-top: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; page-break-after: avoid;">3. Bireysel Risk Etkenleri (SHAP Analizi)</h2>
          <div style="display: flex; gap: 15px; margin-top: 15px;">
              <div style="flex: 1; background: #fff1f2; border: 1px solid #ffe4e6; padding: 15px; border-radius: 8px;">
                  <strong style="color: #e11d48; font-size: 13px; display: block; border-bottom: 1px solid #fda4af; padding-bottom: 5px; margin-bottom: 8px;">📈 Riski Artıran Ana Faktörler</strong>
                  <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #4c0519; line-height: 1.6;">
                      ${riskIncreasers.map(s => `<li>${s.feature}</li>`).join('')}
                  </ul>
              </div>
              <div style="flex: 1; background: #ecfdf5; border: 1px solid #d1fae5; padding: 15px; border-radius: 8px;">
                  <strong style="color: #059669; font-size: 13px; display: block; border-bottom: 1px solid #6ee7b7; padding-bottom: 5px; margin-bottom: 8px;">📉 Riski Düşüren Ana Faktörler</strong>
                  <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #064e3b; line-height: 1.6;">
                      ${riskDecreasers.map(s => `<li>${s.feature}</li>`).join('')}
                  </ul>
              </div>
          </div>
        </div>
      `;
    }

    const totalDelays = (parseFloat(currentFeatures['NumberOfTime30-59DaysPastDueNotWorse']) || 0) + 
                        (parseFloat(currentFeatures['NumberOfTime60-89DaysPastDueNotWorse']) || 0) + 
                        (parseFloat(currentFeatures['NumberOfTimes90DaysLate']) || 0);

    const reportHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 10px 30px; color: #1e293b; background-color: white; box-sizing: border-box;">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #0284c7; padding-bottom: 15px; margin-bottom: 25px;">
          <div>
            <h1 style="color: #0f172a; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Finansal Risk Analiz Raporu</h1>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 13px; font-weight: 500;">Explainable AI (XAI) Sistem Çıktısı</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; color: #0f172a; font-weight: bold; font-size: 14px;">Tarih: ${reportDate.toLocaleDateString('tr-TR')}</p>
            <p style="margin: 2px 0 0 0; color: #94a3b8; font-size: 11px;">Rapor ID: #${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 25px; display: flex; justify-content: space-between;">
          <div><span style="color:#64748b; font-size:11px; text-transform:uppercase; display:block;">Yaş</span><strong style="font-size:16px; color:#0f172a;">${currentFeatures.age || '-'}</strong></div>
          <div><span style="color:#64748b; font-size:11px; text-transform:uppercase; display:block;">Aylık Net Gelir</span><strong style="font-size:16px; color:#0f172a;">${currentFeatures.MonthlyIncome ? Number(currentFeatures.MonthlyIncome).toLocaleString('tr-TR') + ' ₺' : '-'}</strong></div>
          <div><span style="color:#64748b; font-size:11px; text-transform:uppercase; display:block;">Toplam Gecikme</span><strong style="font-size:16px; color:#0f172a;">${totalDelays} Kez</strong></div>
          <div><span style="color:#64748b; font-size:11px; text-transform:uppercase; display:block;">Açık Kredi/Kart</span><strong style="font-size:16px; color:#0f172a;">${currentFeatures.NumberOfOpenCreditLinesAndLoans || '0'} Adet</strong></div>
        </div>

        <h2 style="color: #0284c7; font-size: 16px; margin-top: 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; page-break-after: avoid;">1. XAI Yönetici Özeti</h2>
        <p style="background-color: #f0f9ff; padding: 16px; border-left: 4px solid #0284c7; border-radius: 0 8px 8px 0; line-height: 1.6; font-size: 13px; margin-bottom: 0; page-break-inside: avoid;">
          ${result.xai_advice || "XAI motoru yanıt vermedi."}
        </p>

        <div style="page-break-inside: avoid;">
          <h2 style="color: #0f172a; font-size: 16px; margin-top: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; page-break-after: avoid;">2. İstatistiksel Model Çıktısı</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;">
            <tr>
              <td style="padding: 12px; border: 1px solid #cbd5e1; background-color: #f1f5f9; width: 50%; color: #475569; font-weight: 500;">Risk Seviyesi Kategorisi</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1; text-transform: uppercase; font-weight: bold; color: ${result.risk_level === 'low' ? '#059669' : result.risk_level === 'medium' ? '#d97706' : '#dc2626'}; text-align: right;">
                ${result.risk_label || result.risk_level}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #cbd5e1; background-color: #f1f5f9; color: #475569; font-weight: 500;">Matematiksel Risk Olasılığı</td>
              <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: bold; text-align: right; font-size: 18px; color: #0f172a;">
                %${((result.risk_probability || 0) * 100).toFixed(1)}
              </td>
            </tr>
          </table>
        </div>

        ${shapHtml}

        <div class="html2pdf__page-break"></div>

        <h2 style="color: #0f172a; font-size: 16px; margin-top: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">${shapHtml ? '4' : '3'}. Yapay Zeka Tavsiyeli Eylem Planı</h2>
        <div style="margin-top: 15px;">
          ${recHtmlBlocks}
        </div>

        <div style="margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; page-break-inside: avoid;">
          <p style="margin: 0; font-weight: bold; color: #64748b;">Bu rapor, Explainable AI (XAI) destekli Random Forest algoritması tarafından otomatik olarak üretilmiştir.</p>
          <p style="margin: 4px 0 0 0;">Yasal Uyarı: Bu belge resmi bir finansal danışmanlık niteliği taşımaz, sadece girilen verilere dayalı istatistiksel bir risk projeksiyonu sunar.</p>
        </div>
      </div>
    `;

    const opt = {
      margin: 0.3, 
      filename: `Finansal_Risk_Raporu_${reportDate.toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 }, 
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }, 
      pagebreak: { mode: ['css', 'legacy', 'avoid-all'] } 
    };
    
    html2pdf().set(opt).from(reportHtml).save();
};
