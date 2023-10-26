const request = require('request');
const ipRequestUrl = 'https://api.ipify.org?format=json';
const geoRequestUrl = 'http://ipwho.is/';

/**
 * Makes a single API request to retrieve the user's IP address.
 * Input:
 *   - A callback (to pass back an error or the IP string)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The IP address as a string (null if error). Example: "162.245.144.188"
 */
const fetchMyIP = function(callback) {
  request(`${ipRequestUrl}`, (error, response, body) => {
    try {
      if (response.statusCode !== 200) {
        const msg = `Status Code ${response.statusCode} when fetching IP. Response: ${body}`;
        callback(Error(msg), null);
        return;
      }
      const ip = JSON.parse(body).ip;
      callback(null, ip);
    } catch (error) {
      callback(error, null);
    }
  });
};

/**
 * Makes a single API request to retrieve the user's geo co-ordinates using their IP address.
 * Input:
 *   - A callback (to pass back an error or the IP string) & IP address (string)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The an object containing latitude and longitude (null if error). Example { latitude: '49.27670', longitude: '-123.13000' }
 */
const fetchCoordsByIP = function(ip, callback) {
  request(`${geoRequestUrl}${ip}`, (error, response, body) => {

    if (error) {
      callback(error, null);
      return;
    }

    const parsedBody = JSON.parse(body);

    if (!parsedBody.success) {
      const message = `Success status was ${parsedBody.success}. Server message says: ${parsedBody.message} when fetching geo co-ordinates for IP ${parsedBody.ip}`;
      callback(Error(message), null);
      return;
    } 

    const { latitude, longitude } = parsedBody;

    callback(null, {latitude, longitude});
  });
};


module.exports = { fetchMyIP, fetchCoordsByIP };