import React, { useState, useEffect} from 'react';
import Chart from './Chart';

import './App.css';

const App = () => {
  const [chartData, setChartData] = useState([])

  useEffect(() => {
      getData()
  }, []);

  const getData = async () => {
    const res = await fetch("/fitData");
    const fitArray = await res.json();
    let sorted = fitArray.sort((a, b) => (a.date > b.date) ? 1 : -1)
    setChartData(sorted);
  }

  const updateTable = async () => {
    try {
      const options = { method: 'POST' }
      const res = await fetch('/update',options);
      const message = await res.json()
      console.log(message.status)
      getData()
    } catch (err) {
      console.error(err.message);
    }
  };
 
  return (
    <div className="grid-container">
    <div className="Top"></div>
    <div className="Title">
      <p className="runtopia">RUNTOPIA.</p> 
      <div>
        <button className="big-button" onClick= {updateTable}>Get Data</button>
      </div>          
    </div>
    <div className="Weekly">
      <Chart key={chartData} data={chartData} />
    </div>
    <div className="Bottom"></div>
  </div>
  );
}

export default App;
