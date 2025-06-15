const axios = require('axios');

const INFOBIP_BASE_URL = 'https://8k6y8e.api.infobip.com';
const INFOBIP_API_KEY = 'ab1469663e19d743fc338e8e17f80254-3ea08266-df61-4dec-ba70-05670e538c4e';
const INFOBIP_SENDER = 'Ajdinovici';

// Funkcija za formatiranje broja telefona
function formatPhoneNumber(phone) {
  // Ukloni sve znakove osim brojeva
  const cleaned = phone.replace(/\D/g, '');
  
  // Ako broj počinje sa 0, zamijeni sa +387
  if (cleaned.startsWith('0')) {
    // Provjeri da li je broj validan (8 ili 9 cifara nakon 0)
    if (cleaned.length !== 9 && cleaned.length !== 10) {
      throw new Error('Neispravan broj telefona. Broj mora imati 8 ili 9 cifara nakon 0.');
    }
    return '+387' + cleaned.substring(1);
  }
  
  // Ako broj već ima 387, samo dodaj +
  if (cleaned.startsWith('387')) {
    // Provjeri da li je broj validan (8 ili 9 cifara nakon 387)
    if (cleaned.length !== 11 && cleaned.length !== 12) {
      throw new Error('Neispravan broj telefona. Broj mora imati 8 ili 9 cifara nakon 387.');
    }
    return '+' + cleaned;
  }
  
  // Ako nema ni 0 ni 387, dodaj +387
  // Provjeri da li je broj validan (8 ili 9 cifara)
  if (cleaned.length !== 8 && cleaned.length !== 9) {
    throw new Error('Neispravan broj telefona. Broj mora imati 8 ili 9 cifara.');
  }
  return '+387' + cleaned;
}

const infobipClient = axios.create({
  baseURL: INFOBIP_BASE_URL,
  headers: {
    'Authorization': `App ${INFOBIP_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export async function sendSMS(phoneNumber, message) {
  try {
    // Formatiraj broj telefona
    const formattedNumber = formatPhoneNumber(phoneNumber);
    console.log('Sending SMS to:', formattedNumber); // Dodajemo log za debugging
    
    const response = await infobipClient.post('/sms/2/text/advanced', {
      messages: [
        {
          destinations: [{ to: formattedNumber }],
          from: INFOBIP_SENDER,
          text: message
        }
      ]
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error sending SMS:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

export function formatReservationMessage(reservation) {
  if (reservation.action === 'reservation') {
    return `Poštovani ${reservation.name},\n\nVaša rezervacija je uspješno primljena:\n\nDatum dolaska: ${reservation.check_in}\nDatum odlaska: ${reservation.check_out}\nTip smještaja: ${reservation.room_type}\nBroj gostiju: ${reservation.guests}\n\nUgodan ostatak dana Vam želimo tima SRCA! ❤️\n\nAjdinovići`;
  } else {
    return `Poštovani ${reservation.name},\n\nVaš upit je uspješno primljen. Uskoro ćemo Vas kontaktirati.\n\nUgodan ostatak dana Vam želimo tima SRCA! ❤️\n\nAjdinovići`;
  }       
}     