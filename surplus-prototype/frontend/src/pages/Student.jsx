
import React, {useEffect,useState} from 'react';
import axios from 'axios';
import QRCode from 'qrcode.react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Student(){
  const [items,setItems]=useState([]);
  const [orderInfo,setOrderInfo]=useState(null);
  useEffect(()=>{ fetchItems(); },[]);
  async function fetchItems(){ const res = await axios.get(API+'/api/items'); setItems(res.data); }
  async function reserve(itemId){
    try{
      const res = await axios.post(API+'/api/orders',{itemId,quantity:1},{headers:{authorization:'Bearer seedtoken'}});
      setOrderInfo(res.data);
      fetchItems();
    }catch(err){ console.log(err); }
  }
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Student Dashboard (demo)</h2>
      <div>
        <ul>
          {items.map(it=>(
            <li key={it.id} className="border p-2 my-2">
              <div className="flex justify-between">
                <div>
                  <div className="font-bold">{it.name} — ₹{it.discountedPrice} ({it.quantity})</div>
                  <div>Expires: {new Date(it.bestBefore).toLocaleString()}</div>
                </div>
                <div>
                  <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={()=>reserve(it.id)}>Reserve (demo)</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {orderInfo && (
        <div className="mt-4 p-3 border">
          <h3 className="font-semibold">Your Order QR</h3>
          <img src={orderInfo.qrData} alt="qr" style={{maxWidth:200}}/>
          <div>Order ID: {orderInfo.order.id}</div>
        </div>
      )}
    </div>
  )
}
