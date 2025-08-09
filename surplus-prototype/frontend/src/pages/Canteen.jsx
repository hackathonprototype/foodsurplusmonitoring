
import React, {useEffect, useState} from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Canteen(){
  const [items,setItems]=useState([]);
  const [form,setForm]=useState({name:'',description:'',quantity:1,originalPrice:100,discountedPrice:80,bestBefore:'',veg:false,location:'Canteen A'});
  useEffect(()=>{ fetchItems(); },[]);
  async function fetchItems(){ const res = await axios.get(API+'/api/items'); setItems(res.data); }
  async function addItem(e){ e.preventDefault(); try{ await axios.post(API+'/api/items', {...form, bestBefore: form.bestBefore || new Date(Date.now()+10*60000).toISOString()}, {headers:{authorization:'Bearer seedtoken'}}); }catch(err){ console.log(err); } fetchItems(); }
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Canteen Dashboard (demo)</h2>
      <form className="mb-4" onSubmit={addItem}>
        <input className="border p-1 mr-2" placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
        <input className="border p-1 mr-2" placeholder="Qty" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:parseInt(e.target.value)})}/>
        <input className="border p-1 mr-2" placeholder="BestBefore ISO or leave" value={form.bestBefore} onChange={e=>setForm({...form,bestBefore:e.target.value})}/>
        <button className="bg-green-600 text-white px-3 py-1 rounded">Add</button>
      </form>
      <h3 className="font-semibold">Available Items</h3>
      <ul>
        {items.map(it=>(
          <li key={it.id} className="border p-2 my-2">
            <div className="flex justify-between">
              <div>
                <div className="font-bold">{it.name} ({it.quantity})</div>
                <div>Expires: {new Date(it.bestBefore).toLocaleString()}</div>
                <div>Status: {it.status}</div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
