import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

/**
 * Analyzes a technical error message using the Gemini AI and returns a user-friendly explanation.
 * @param {string} error - The technical error message (e.g., from Axios).
 * @returns {Promise<string>} A simple, human-readable explanation of the downtime cause.
 */
export async function analyzePerformanceAnomalies(stats) {
  if (!stats || stats.length < 10) { // Need enough data to be meaningful
    return 'Insufficient data for performance anomaly detection.';
  }

  const responseTimes = stats.filter(s => s.responseTime !== null).map(s => s.responseTime);
  if (responseTimes.length < 10) {
    return 'Insufficient response time data for anomaly detection.';
  }

  const mean = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const stdDev = Math.sqrt(responseTimes.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / responseTimes.length);

  // Find anomalies (e.g., 2 standard deviations above the mean)
  const anomalies = stats.filter(s => s.responseTime > mean + 2 * stdDev);

  if (anomalies.length === 0) {
    return 'System performance stable. No significant response time anomalies detected.';
  }

  const anomalySummary = anomalies.map(a => ({
    time: new Date(a.timestamp).toISOString(),
    responseTime: a.responseTime.toFixed(0) + 'ms'
  }));

  const prompt = `As a senior performance engineer, analyze the following performance anomalies detected in a website's response times. The average response time was ${mean.toFixed(0)}ms. Provide a brief, technical summary of when the slowdowns occurred and what they might indicate (e.g., server load, network issues). Be concise. The anomalies are: ${JSON.stringify(anomalySummary)}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return text.trim();
  } catch (e) {
    console.error('Error calling Gemini API for anomaly analysis:', e);
    return 'AI performance analysis failed.';
  }
}

export async function summarizeDowntime(downtimeEvents) {
  if (!downtimeEvents || downtimeEvents.length === 0) {
    return 'System status nominal. No downtime events recorded in the last 24 hours.';
  }

  const errorSummary = downtimeEvents
    .map(e => e.error || 'Unknown Error')
    .reduce((acc, cur) => {
      acc[cur] = (acc[cur] || 0) + 1;
      return acc;
    }, {});

  const prompt = `As a senior network engineer, analyze the following summary of downtime errors from a website monitoring tool. Provide a brief, technical summary of the primary issues in 2-3 sentences. Use a confident, professional tone. The summary is: ${JSON.stringify(errorSummary)}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return text.trim();
  } catch (e) {
    console.error('Error calling Gemini API for summary:', e);
    return 'AI analysis failed. Unable to generate downtime summary.';
  }
}

export async function analyzeDowntime(error) {
  if (!error) {
    return 'No specific error was reported.';
  }

  // Sanitize and simplify the error to create a concise prompt
  const simplifiedError = error.toString().substring(0, 200);

  const prompt = `A website uptime monitor reported the following error: "${simplifiedError}". Explain the most likely reason for this website being down in one simple, user-friendly sentence. For example, 'The website's server is not responding.' or 'This website could not be found.' Do not mention technical details like Axios, DNS, or IP addresses.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return text.trim();
  } catch (e) {
    console.error('Error calling Gemini API:', e);
    // Return a generic error if the AI analysis fails
    return 'An unknown error occurred, preventing a detailed analysis.';
  }
}
