const request = require('request');

const ipRequestUrl = 'https://api.ipify.org?format=json';
const geoRequestUrl = 'http://ipwho.is/';
const flyOverRequestBaseUrl = 'https://iss-flyover.herokuapp.com/json/?';

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

    callback(null, { latitude, longitude });
  });
};

/**
 * Makes a single API request to retrieve upcoming ISS fly over times the for the given lat/lng coordinates.
 * Input:
 *   - An object with keys `latitude` and `longitude`
 *   - A callback (to pass back an error or the array of resulting data)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly over times as an array of objects (null if error). Example:
 *     [ { risetime: 134564234, duration: 600 }, ... ]
 */
const fetchISSFlyOverTimes = function(coords, callback) {
  const url = `${flyOverRequestBaseUrl}lat=${coords.latitude}&lon=${coords.longitude}`;

  request(url, (error, response, body) => {

    if (error) {
      callback(error, null);
      return;
    }

    if (response.statusCode !== 200) {
      const message = `Status Code ${response.statusCode} when fetching ISS pass times: ${body}`;
      callback(Error(message), null);
      return;
    }

    const flyOverData = JSON.parse(body).response;

    callback(null, flyOverData);
  });
};

// iss.js 

/**
 * Orchestrates multiple API requests in order to determine the next 5 upcoming ISS fly overs for the user's current location.
 * Input:
 *   - A callback with an error or results. 
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly-over times as an array (null if error):
 *     [ { risetime: <number>, duration: <number> }, ... ]
 */
const nextISSTimesForMyLocation = function(callback) {
  fetchMyIP((error, ip) => {
    if (error) {
      return callback(error, null);
    }

    fetchCoordsByIP(ip, (error, loc) => {
      if (error) {
        return callback(error, null);
      }

      fetchISSFlyOverTimes(loc, (error, nextPasses) => {
        if (error) {
          return callback(error, null);
        }

        callback(null, nextPasses);
      });
    });
  });
};

module.exports = { nextISSTimesForMyLocation };