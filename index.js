const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
const path = require("path");
const fetch = require("node-fetch");
require("dotenv").config();
const moment = require("moment");
const _ = require("lodash")

const PORT = process.env.PORT || 5000;

//process.env.PORT
//process.env.NODE_ENV => production or undefined

//middleware
app.use(cors());
app.use(express.json()); // => allows us to access the req.body

// app.use(express.static(path.join(__dirname, "client/build")));
// app.use(express.static("./client/build")); => for demonstration

if (process.env.NODE_ENV === "production") {
  //server static content
  //npm run build
  app.use(express.static(path.join(__dirname, "client/build")));
}

//ROUTES//

app.get("/fitData", async (req, res) => {
  try {
    const allHistoricalData = await pool.query("SELECT * FROM runTable");
    res.json(allHistoricalData.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.post("/update", async (req, res) => {
  try {
    //make api call
    let authcode = process.env.AUTHCODE;
    const headers = {Accept: "application/x-www-form-urlencoded", Authorization:`Bearer ${authcode}`}
    let date = new Date().toISOString().substring(0, 10);
    const response = await fetch(`https://api.fitbit.com/1/user/-/activities/list.json?beforeDate=${date}&sort=desc&offset=0&limit=100`, {headers: headers})
    const json = await response.json() 
    const runList =  json.activities.filter(activity => activity.heartRateZones)
    //narrow api response to just the fields needed
    let initial =  runList.map(activity => ({
                title : activity.activityName,
                date: activity.startTime,
                zones : activity.heartRateZones.reduce((a,b,i) => a + b.minutes*(i),0),          
              }));
    let sorted = initial.sort((a, b) => (a.date > b.date) ? 1 : -1)
    //convert date to timestamp then to week year
    let dateData = sorted.map((activity) => (
              {
                weekYear: [moment(new Date(activity.date).getTime()).week(), moment(new Date(activity.date).getTime()).year()],
                effort: activity.zones,
                timestamp: new Date(activity.date),
              }))
      //groupby week and sum effort using lodash
      let sumData = _(dateData)
      .groupBy('weekYear')
      .map((v, k) => ({
          weekYear: k,
          effort: _.sumBy(v, 'effort'),
      })).value(); 
      //add highs and lows using summed effort
      let highLowData = sumData.map((activity,i,arr) => (
          {
            weekYear: activity.weekYear,
            split: activity.weekYear.split(','),
            effort: activity.effort,
            high: i >= 3 ? ((arr[i-3].effort + arr[i-2].effort + arr[i-1].effort + arr[i].effort)/4)*1.2:
                  i === 2 ? ((arr[i-2].effort + arr[i-1].effort + arr[i].effort)/3)*1.3:
                  i === 1 ? ((arr[i-1].effort + arr[i].effort)/2)*1.5 :
                  arr[i].effort*2,
            low: i >= 3 ? ((arr[i-3].effort + arr[i-2].effort + arr[i-1].effort + arr[i].effort)/4)*.5 :
                  i === 2 ? ((arr[i-2].effort + arr[i-1].effort + arr[i].effort)/3)*.4 :
                  i === 1 ? ((arr[i-1].effort + arr[i].effort)/2)*.3 :
                  arr[i].effort*.25,
          }
      ))
      //add color coding based on highs and lows
      let finalData = highLowData.map((activity) => (
        {
          weekYear: activity.weekYear,
          //parsing weekYear back into a date for the chart
          date: moment().day('Monday').year(parseInt(activity.split[1])).week(parseInt(activity.split[0])).toDate(),
          effort: activity.effort,
          high: activity.high,
          low: activity.low,
          lineColor: (activity.effort > activity.high) ? '#92E2F9' : (activity.effort < activity.low) ? '#0E225E' : '#568BB3',
          message1: (activity.effort > activity.high) ? 'Above Weekly Range,' : (activity.effort < activity.low) ? 'Below Weekly Range,' : 'Steady Progress,' ,
          message2: (activity.effort > activity.high) ? 'Significant Increase.' : (activity.effort < activity.low) ? 'Lighter than Average.' : 'Good for Maintaining.',
          
        }
      ))
    //end formatting of data, begin updating table
    let combined
    const historicalData = await pool.query("SELECT * FROM runTable");
    const hello = await pool.query("TRUNCATE runTable");
    const newFitbitData = finalData
    const newWeeks = newFitbitData.map(row => row.weekYear)
    const removeOverlap = historicalData.rows.filter(row => !newWeeks.includes(row.weekYear))
    combined = [...removeOverlap, ...newFitbitData]
  
    for(const row of combined){
      const {weekYear,date,effort,high,low,lineColor,message1,message2} = row
      const insertRow = await pool.query(`INSERT INTO runTable ("weekYear",date,effort,high,low,"lineColor",message1,message2) 
                                          VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, 
                                          [weekYear, date,effort,high,low,lineColor,message1,message2]);
    }
    res.json({status: "this is the backend saying, got the lastest fitbit Data!"})
  } catch (err) {
    console.error(err.message);
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is starting on port ${PORT}`);
});
