const express = require('express');
const { google } = require('googleapis');
const credentials = require('./credentials.js');
const path = require('path');

require("dotenv").config();

const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: 'https://www.googleapis.com/auth/spreadsheets',
});

const spreadsheetId = '1Ife62mCGjIK-oi3CpKn4H86Pq-qhCO0haKBcLErG8-o';

// Get metadata about spreadsheet
// const metaData = await googleSheets.spreadsheets.get({
//   auth,
//   spreadsheetId,
// });

function generateId (data) {
  return data.map((item,index) => ([`${item[0]}-${index}`, ...item]))
}

app.get('/', async (req, res) => {
  // Create client instance for auth
  const client = await auth.getClient();

  // Instance of Google sheets API
  const googleSheets = google.sheets({ version: 'v4', auth: client });

  // Read rows from spreadsheet
  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: 'Blad1',
  });

  const rawWithCustomId = generateId(getRows.data.values);
  const withPlaceholder = rawWithCustomId.map((item) => {
    if(item.length < 5) {
        item.push(' ');
    } 
    return item
  })

  res.render('index', { data: rawWithCustomId.slice(1) });
});

app.post('/', async (req, res) => {
  const response = req.body;

  const client = await auth.getClient();
  const googleSheets = google.sheets({ version: 'v4', auth: client });

  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: 'Blad1',
  });

  const originalValues = generateId(getRows.data.values);
  const updatedValues = originalValues.map((val, index) => {
    const value = response[val[0]] || '';
    return {
    range: index + 1,
    value,
   }
  }).filter(({value}) => !!value);

  updatedValues.forEach(async (val) => {
    const {range:index, value} = val;
    try {

      // Write row(s) to spreadsheet
     await googleSheets.spreadsheets.values.update({
      auth,
      spreadsheetId,
      range: `Blad1!D${index}:E`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[value ]],
      },
    });
    }catch(e) {
      console.error('Error while updating data, index:', `Blad1!D${index}:E`)
      console.error(e);
    }
  })

  res.send('Updated!');
});

app.listen(1337, (req, res) => console.log('running on 1337'));
