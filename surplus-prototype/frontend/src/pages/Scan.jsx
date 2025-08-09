
import React, {useEffect, useRef, useState} from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Scan(){
  const [log,setLog]=useState('');
  const regionId = "reader";
  useEffect(()=>{
    const html5QrCode = new Html5Qrcode(regionId);
    Html5Qrcode.getCameras().then(cameras=>{
      if(cameras && cameras.length){
        html5QrCode.start(
          cameras[0].id,
          { fps: 10, qrbox: 250 },
          qrCodeMessage=>{
            // call backend scan
            fetch(API+'/api/orders/scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({qrToken:qrCodeMessage})})
              .then(r=>r.json()).then(data=> setLog(JSON.stringify(data))).catch(e=>setLog('error'));
            html5QrCode.stop();
          },
          errorMessage=>{}
        ).catch(err=> setLog('camera start error: '+err));
      }
    }).catch(err=> setLog('no camera: '+err));
    return ()=>{ try{ html5QrCode.stop(); }catch(e){} }
  },[]);
  return (<div>
    <h2 className="text-xl font-bold mb-2">QR Scanner (Canteen)</h2>
    <div id={regionId} style={{width:320}}></div>
    <div className="mt-2">Result: <pre>{log}</pre></div>
  </div>)
}
