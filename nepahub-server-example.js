/*
  NepaHub production-backend starting point.
  This is intentionally payment-provider-neutral: connect your actual merchant API/webhook
  instead of guessing a provider or payment ID from a phone number.

  Install: npm i express cors bcrypt jsonwebtoken multer
  Run:     ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='change-me' node nepahub-server-example.js
*/
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json({limit:'2mb'}));
const upload = multer({dest:'./uploads'});
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PRODUCTION';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'owner@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'CHANGE_ME';
const PAYMENT_DESTINATION = '9763734429';

const users = new Map();
const orders = new Map();

function sign(user){ return jwt.sign({sub:user.id,email:user.email,role:user.role},JWT_SECRET,{expiresIn:'7d'}); }
function auth(req,res,next){
  try{const token=(req.headers.authorization||'').replace(/^Bearer\s+/,'');req.user=jwt.verify(token,JWT_SECRET);next();}
  catch{res.status(401).json({error:'Unauthorized'});}
}
function admin(req,res,next){if(req.user?.role!=='admin') return res.status(403).json({error:'Forbidden'});next();}

app.get('/api/config',(req,res)=>res.json({paymentDestination:PAYMENT_DESTINATION}));
app.post('/api/auth/register',async(req,res)=>{const {name,email,password}=req.body||{};if(!name||!email||!password||password.length<8)return res.status(400).json({error:'Name, email and an 8+ character password are required.'});const key=email.toLowerCase();if(users.has(key))return res.status(409).json({error:'Account already exists.'});const user={id:crypto.randomUUID(),name,email:key,passwordHash:await bcrypt.hash(password,12),role:'student'};users.set(key,user);res.json({token:sign(user),user:{id:user.id,name:user.name,email:user.email}})});
app.post('/api/auth/login',async(req,res)=>{const {email,password}=req.body||{};const key=String(email||'').toLowerCase();const user=users.get(key);if(!user||!(await bcrypt.compare(password||'',user.passwordHash)))return res.status(401).json({error:'Invalid login.'});res.json({token:sign(user),user:{id:user.id,name:user.name,email:user.email}})});
app.post('/api/auth/admin-login',async(req,res)=>{const {email,password}=req.body||{};if(String(email||'').toLowerCase()!==ADMIN_EMAIL.toLowerCase()||String(password||'')!==ADMIN_PASSWORD)return res.status(401).json({error:'Invalid owner login.'});const user={id:'admin',name:'Owner',email:ADMIN_EMAIL,role:'admin'};res.json({token:sign(user),user})});
app.get('/api/orders',auth,(req,res)=>res.json([...orders.values()].filter(o=>o.userId===req.user.sub)));
app.post('/api/orders',auth,upload.single('proof'),(req,res)=>{const {courseId,courseTitle,amount,phone,website,paymentMethod,txId}=req.body||{};if(!courseId||!courseTitle||!amount||!txId)return res.status(400).json({error:'Missing order fields.'});const order={id:crypto.randomUUID(),userId:req.user.sub,email:req.user.email,courseId,courseTitle,amount:Number(amount),phone,website,paymentMethod,txId,proofPath:req.file?.path||null,status:'pending',createdAt:new Date().toISOString()};orders.set(order.id,order);res.json(order)});
app.get('/api/admin/orders',auth,admin,(req,res)=>res.json([...orders.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt))));
app.post('/api/admin/orders/:id/verify',auth,admin,(req,res)=>{const order=orders.get(req.params.id);if(!order)return res.status(404).json({error:'Order not found.'});order.status='paid';order.verifiedAt=new Date().toISOString();/* Replace with provider-side transaction verification here. */res.json(order)});
app.post('/api/admin/orders/:id/reject',auth,admin,(req,res)=>{const order=orders.get(req.params.id);if(!order)return res.status(404).json({error:'Order not found.'});order.status='rejected';res.json(order)});
app.listen(process.env.PORT||3000,()=>console.log(`NepaHub backend listening on ${process.env.PORT||3000}`));
