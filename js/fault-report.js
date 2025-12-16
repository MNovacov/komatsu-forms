// api/uploadPdf.js - Archivo NUEVO en tu proyecto komatsu-api
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }
  
  console.log('📤 API uploadPdf recibiendo PDF...');
  
  try {
    // Parsear el body que viene como base64
    const { pdfBase64, reportNumber } = req.body;
    
    if (!pdfBase64 || !reportNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'pdfBase64 y reportNumber son requeridos' 
      });
    }
    
    // Extraer base64
    const base64Data = pdfBase64.split(',')[1];
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    
    console.log(`📄 PDF recibido: ${reportNumber}, tamaño: ${pdfBuffer.length} bytes`);
    
    // Subir a Uploadcare DESDE EL BACKEND
    const formData = new FormData();
    formData.append('UPLOADCARE_PUB_KEY', 'dd2580a9c669d60b5d49');
    formData.append('UPLOADCARE_STORE', '1');
    
    // Crear Blob desde buffer
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('file', blob, `Informe_${reportNumber}.pdf`);
    
    console.log('⬆️ Subiendo a Uploadcare...');
    
    const uploadRes = await fetch('https://upload.uploadcare.com/base/', {
      method: 'POST',
      body: formData,
      duplex: 'half'
    });
    
    const uploadData = await uploadRes.json();
    
    if (!uploadData.file) {
      throw new Error('Uploadcare no devolvió file ID');
    }
    
    const pdfUrl = `https://ucarecdn.com/${uploadData.file}/`;
    console.log('✅ PDF subido:', pdfUrl);
    
    return res.status(200).json({
      success: true,
      pdfUrl: pdfUrl,
      message: 'PDF subido exitosamente'
    });
    
  } catch (error) {
    console.error('🔥 Error en uploadPdf:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}