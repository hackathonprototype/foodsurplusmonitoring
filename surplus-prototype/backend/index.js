
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Low, JSONFile } = require('lowdb');
const cron = require('node-cron');
const { nanoid } = require('nanoid');
const QRCode = require('qrcode');

const app = express();
app.use(cors());
app.use(express.json());

const adapter = new JSONFile('db.json');
const db = new Low(adapter);

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt';
const NGO_THRESHOLD_MINUTES = 1; // short for demo

async function initDB(){
  await db.read();
  db.data = db.data || { users: [], items: [], orders: [], events: [], ngoLogs: []};
  await db.write();
}
initDB();

// simple auth
app.post('/api/auth/register', async (req,res)=>{
  const {name,email,password,role} = req.body;
  await db.read();
  if(db.data.users.find(u=>u.email===email)) return res.status(400).json({error:'Email exists'});
  const hash = await bcrypt.hash(password,8);
  const user = {id: nanoid(), name, email, passwordHash: hash, role};
  db.data.users.push(user);
  await db.write();
  const token = jwt.sign({id:user.id, role:user.role}, JWT_SECRET, {expiresIn:'7d'});
  res.json({token, user:{id:user.id,name:user.name,email:user.email,role:user.role}});
});

app.post('/api/auth/login', async (req,res)=>{
  const {email,password} = req.body;
  await db.read();
  const user = db.data.users.find(u=>u.email===email);
  if(!user) return res.status(400).json({error:'Invalid'});
  const ok = await bcrypt.compare(password, user.passwordHash);
  if(!ok) return res.status(400).json({error:'Invalid'});
  const token = jwt.sign({id:user.id, role:user.role}, JWT_SECRET, {expiresIn:'7d'});
  res.json({token, user:{id:user.id,name:user.name,email:user.email,role:user.role}});
});

function authMiddleware(req,res,next){
  const header = req.headers.authorization;
  if(!header) return res.status(401).json({error:'no auth'});
  const token = header.split(' ')[1];
  try{
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  }catch(e){
    return res.status(401).json({error:'invalid token'});
  }
}

// Items
app.get('/api/items', async (req,res)=>{
  await db.read();
  const items = db.data.items.filter(i=>i.status==='available' || i.status==='ngo_reserved');
  res.json(items);
});

app.post('/api/items', authMiddleware, async (req,res)=>{
  if(!['canteen','organizer'].includes(req.user.role)) return res.status(403).json({error:'forbidden'});
  const {name,description,quantity,originalPrice,discountedPrice,bestBefore,veg,location} = req.body;
  await db.read();
  const item = {id:nanoid(), name,description,quantity,originalPrice,discountedPrice,bestBefore,veg,location,createdAt:new Date().toISOString(),status:'available',canteenId:req.user.id};
  db.data.items.push(item);
  await db.write();
  res.json(item);
});

app.post('/api/orders', authMiddleware, async (req,res)=>{
  if(req.user.role!=='student') return res.status(403).json({error:'students only'});
  const {itemId,quantity} = req.body;
  await db.read();
  const item = db.data.items.find(i=>i.id===itemId);
  if(!item || item.status!=='available') return res.status(400).json({error:'not available'});
  if(quantity>item.quantity) return res.status(400).json({error:'insufficient quantity'});
  const order = {id:nanoid(), itemId, userId:req.user.id, quantity, status:'reserved', createdAt:new Date().toISOString(), qrToken:null};
  // generate qrToken as signed string
  const payload = {orderId:order.id, exp: Math.floor(Date.now()/1000) + (60*60)};
  const token = jwt.sign(payload, JWT_SECRET);
  order.qrToken = token;
  db.data.orders.push(order);
  item.quantity -= quantity;
  if(item.quantity<=0) item.status='reserved';
  await db.write();
  // also generate QR data URL via QRCode (backend)
  const qrData = await QRCode.toDataURL(token);
  res.json({order, qrData});
});

app.post('/api/orders/scan', async (req,res)=>{
  const {qrToken} = req.body;
  try{
    const payload = jwt.verify(qrToken, JWT_SECRET);
    await db.read();
    const order = db.data.orders.find(o=>o.id===payload.orderId);
    if(!order) return res.status(400).json({error:'order not found'});
    if(order.status==='picked') return res.status(400).json({error:'already picked'});
    order.status='picked';
    order.pickedAt=new Date().toISOString();
    await db.write();
    return res.json({ok:true,order});
  }catch(e){
    return res.status(400).json({error:'invalid token'});
  }
});

// events (simulated)
app.post('/api/events', authMiddleware, async (req,res)=>{
  if(req.user.role!=='organizer') return res.status(403).json({error:'organizer only'});
  const {title,startTime,endTime} = req.body;
  await db.read();
  const ev = {id:nanoid(), title, startTime, endTime, organizerId:req.user.id, promptSent:false};
  db.data.events.push(ev);
  await db.write();
  res.json(ev);
});
app.get('/api/events', async (req,res)=>{
  await db.read();
  res.json(db.data.events || []);
});

// NGO logs
app.get('/api/ngo/logs', authMiddleware, async (req,res)=>{
  if(req.user.role!=='ngo') return res.status(403).json({error:'ngo only'});
  await db.read();
  res.json(db.data.ngoLogs || []);
});

// seed helper
app.get('/api/seed/status', async (req,res)=>{
  await db.read();
  res.json({users:db.data.users.length, items:db.data.items.length});
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>{ console.log('Backend running on',PORT); });

// Scheduler: every 30 seconds for demo
cron.schedule('*/30 * * * * *', async ()=>{
  await db.read();
  const now = new Date();
  // expire items
  for(const item of db.data.items){
    if(item.status==='available' || item.status==='ngo_reserved'){
      const best = new Date(item.bestBefore);
      if(best <= now){
        item.status = 'expired';
        db.data.ngoLogs.push({id:nanoid(), itemId:item.id, notifiedAt:new Date().toISOString(), status:'expired_auto'});
      } else {
        // notify NGO if within threshold and still available
        const diffMin = (best - now)/60000;
        if(diffMin <= NGO_THRESHOLD_MINUTES && item.status==='available' && item.quantity>0){
          item.status = 'ngo_reserved';
          const log = {id:nanoid(), itemId:item.id, notifiedAt:new Date().toISOString(), status:'sent'};
          db.data.ngoLogs.push(log);
          // simulate auto-accept after short delay
          setTimeout(async ()=>{
            await db.read();
            const l = db.data.ngoLogs.find(x=>x.id===log.id);
            if(l) l.status='accepted';
            await db.write();
          },5000);
        }
      }
    }
  }
  await db.write();
});
