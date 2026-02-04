const API_BASE_URL = 'https://localhost:7205/api/faq';

export const getFaqAnswer = async (question: string): Promise<string> => {
    try {
        const url = `${API_BASE_URL}/answer?question=${encodeURIComponent(question)}`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`API Error: ${response.status} ${response.statusText}`);
            return "Sajnálom, hiba történt a szerver oldalon a válasz lekérésekor. Kérem, próbálja újra.";
        }

        const data = await response.json();

        const answer = data.answer || data.Answer;

        if (!answer) {
            console.error("Response data:", data);
            return "A válasz formátuma hibás a szerverről.";
        }

        return answer;

    } catch (error) {
        console.error("Fetch Error:", error);
        return "A hálózati kapcsolat megszakadt, vagy a szerver nem elérhető.";
    }
};