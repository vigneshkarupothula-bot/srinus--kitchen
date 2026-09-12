import { useState, useEffect, useMemo } from "react";
import { storageGet, storageSet } from "./storage";
import {
  ChefHat, ArrowRight, ArrowLeft, ShoppingBag, Plus, Minus, Trash2, X,
  Search, CheckCircle2, Clock, MapPin, Phone, Pencil, Bike, Store,
  LogOut, Lock, PackageCheck
} from "lucide-react";

/* ---------------------------------- tokens ---------------------------------- */
const C = {
  cream: "#F7F1E3", paper: "#FFFDF8", ink: "#2E2118", inkSoft: "#6B5D4F",
  mustard: "#C98A1F", mustardDark: "#8A5E14", chili: "#A8351E", sage: "#5C7A4E",
  line: "#E0D3B3", charcoal: "#1E1B18", charcoal2: "#28241F", ticket: "#EFE7D8",
  ticketLine: "#C9BC9C", cloth: "#F3EDE1"
};
const FONT_DISPLAY = "'Rockwell','Roboto Slab',Georgia,'Times New Roman',serif";
const FONT_BODY = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
const FONT_MONO = "'Courier New',ui-monospace,monospace";

const PICKUP_STEPS = ["Order Placed", "Preparing", "Ready for Pickup", "Completed"];
const DELIVERY_STEPS = ["Order Placed", "Preparing", "Out for Delivery", "Delivered"];
const OWNER_PIN = "1234";

const DEFAULT_MENU = [
  { id: "m1", name: "Chicken 65", desc: "Fiery, deep-fried Andhra-style chicken bites", price: 220, category: "Starters", veg: false, available: true },
  { id: "m2", name: "Paneer Tikka", desc: "Char-grilled cottage cheese, mint chutney", price: 190, category: "Starters", veg: true, available: true },
  { id: "m3", name: "Veg Spring Rolls", desc: "Crisp rolls, sweet chilli dip", price: 150, category: "Starters", veg: true, available: true },
  { id: "m4", name: "Hyderabadi Chicken Biryani", desc: "Dum-cooked basmati, served with mirchi ka salan", price: 260, category: "Biryani & Rice", veg: false, available: true },
  { id: "m5", name: "Veg Dum Biryani", desc: "Layered basmati with seasonal vegetables", price: 200, category: "Biryani & Rice", veg: true, available: true },
  { id: "m6", name: "Jeera Rice", desc: "Steamed basmati tempered with cumin", price: 120, category: "Biryani & Rice", veg: true, available: true },
  { id: "m7", name: "Butter Chicken", desc: "Tandoori chicken in a velvety tomato gravy", price: 280, category: "Curries", veg: false, available: true },
  { id: "m8", name: "Paneer Butter Masala", desc: "Cottage cheese in a rich cashew-tomato gravy", price: 220, category: "Curries", veg: true, available: true },
  { id: "m9", name: "Dal Tadka", desc: "Yellow lentils tempered with garlic and cumin", price: 150, category: "Curries", veg: true, available: true },
  { id: "m10", name: "Butter Naan", desc: "Tandoor-baked leavened bread", price: 40, category: "Breads", veg: true, available: true },
  { id: "m11", name: "Garlic Naan", desc: "Naan topped with roasted garlic", price: 50, category: "Breads", veg: true, available: true },
  { id: "m12", name: "Tandoori Roti", desc: "Whole-wheat bread from the tandoor", price: 25, category: "Breads", veg: true, available: true },
  { id: "m13", name: "Masala Chai", desc: "Spiced milk tea", price: 30, category: "Beverages", veg: true, available: true },
  { id: "m14", name: "Sweet Lassi", desc: "Chilled churned yoghurt drink", price: 70, category: "Beverages", veg: true, available: true },
  { id: "m15", name: "Fresh Lime Soda", desc: "Sweet, salted or plain", price: 60, category: "Beverages", veg: true, available: true },
  { id: "m16", name: "Gulab Jamun (2 pcs)", desc: "Warm milk dumplings in saffron syrup", price: 80, category: "Desserts", veg: true, available: true },
  { id: "m17", name: "Double Ka Meetha", desc: "Hyderabadi bread pudding", price: 100, category: "Desserts", veg: true, available: true }
];

const GLOBAL_CSS = `
  *{box-sizing:border-box}
  button{font-family:inherit;cursor:pointer}
  input,textarea,select{font-family:inherit}
  ::selection{background:${C.mustard};color:${C.paper}}
`;

/* ---------------------------------- storage ---------------------------------- */
async function readKey(key, fallback) {
  try {
    const r = await storageGet(key);
    return JSON.parse(r.value);
  } catch {
    await storageSet(key, JSON.stringify(fallback));
    return fallback;
  }
}
async function writeKey(key, value) {
  try { await storageSet(key, JSON.stringify(value)); } catch (e) { console.error("storage write failed", e); }
}

/* ---------------------------------- small bits ---------------------------------- */
function VegMark({ veg }) {
  const color = veg ? C.sage : C.chili;
  return (
    <span style={{ display: "inline-block", width: 13, height: 13, border: `1.5px solid ${color}`, borderRadius: 2, position: "relative", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: "50%", left: "50%", width: 6, height: 6, background: color, borderRadius: "50%", transform: "translate(-50%,-50%)" }} />
    </span>
  );
}

function StatusTracker({ status, type, dark }) {
  if (status === "Cancelled") {
    return <div style={{ color: C.chili, fontWeight: 600, fontSize: 13 }}>Order cancelled</div>;
  }
  const steps = type === "delivery" ? DELIVERY_STEPS : PICKUP_STEPS;
  const idx = Math.max(0, steps.indexOf(status));
  const dim = dark ? C.cloth : C.inkSoft;
  const on = C.mustard;
  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "unset" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: i <= idx ? on : "transparent", border: `2px solid ${i <= idx ? on : dim}`, flexShrink: 0
            }}>
              {i < idx && <CheckCircle2 size={12} color={dark ? C.charcoal : C.paper} />}
            </div>
            <div style={{ fontSize: 10, marginTop: 4, color: i <= idx ? (dark ? C.cloth : C.ink) : dim, textAlign: "center", maxWidth: 62, lineHeight: 1.2 }}>{s}</div>
          </div>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < idx ? on : dim, marginBottom: 16 }} />}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------- landing ---------------------------------- */
function Landing({ onSelect }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, background: C.cream, color: C.ink, padding: "3rem 1.5rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 34, letterSpacing: "0.01em" }}>Spice Route</div>
        <div style={{ color: C.mustardDark, fontWeight: 600, marginTop: 2, fontSize: 14 }}>Cloud Kitchen</div>
        <p style={{ maxWidth: 300, marginTop: 14, fontSize: 14.5, lineHeight: 1.6, color: C.inkSoft }}>
          Hyderabadi biryanis, home-style curries and more — cooked to order, ready for pickup or delivery.
        </p>
        <button onClick={() => onSelect("customer")} style={{
          marginTop: 22, background: C.mustard, color: C.paper, border: "none", borderRadius: 8,
          padding: "13px 26px", fontSize: 15.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 8
        }}>Order Food <ArrowRight size={17} /></button>
      </div>
      <div style={{ flex: 1, background: C.charcoal, color: C.cloth, padding: "3rem 1.5rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <ChefHat size={26} color={C.mustard} />
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, marginTop: 10 }}>Kitchen Dashboard</div>
        <p style={{ maxWidth: 280, marginTop: 10, fontSize: 13.5, opacity: 0.75, lineHeight: 1.6 }}>
          For the owner — track incoming orders and manage the menu.
        </p>
        <button onClick={() => onSelect("owner")} style={{
          marginTop: 20, background: "transparent", color: C.cloth, border: `1.5px solid ${C.cloth}`,
          borderRadius: 8, padding: "11px 24px", fontSize: 14.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 8
        }}>Kitchen Login <Lock size={14} /></button>
      </div>
    </div>
  );
}

/* ---------------------------------- customer app ---------------------------------- */
function CustomerApp({ menu, orders, addOrder, onExit }) {
  const [screen, setScreen] = useState("menu"); // menu | cart | checkout | confirm | track
  const [cart, setCart] = useState({});
  const [orderType, setOrderType] = useState("pickup");
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [placedId, setPlacedId] = useState(null);
  const [trackPhone, setTrackPhone] = useState("");
  const [searched, setSearched] = useState(false);

  const available = menu.filter(m => m.available);
  const categories = useMemo(() => [...new Set(available.map(m => m.category))], [available]);
  const cartItems = Object.entries(cart).filter(([, q]) => q > 0).map(([id, q]) => {
    const item = menu.find(m => m.id === id);
    return item ? { ...item, qty: q } : null;
  }).filter(Boolean);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);

  const setQty = (id, delta) => setCart(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));

  const placedOrder = orders.find(o => o.id === placedId);
  const myOrders = orders.filter(o => o.phone && trackPhone && o.phone === trackPhone).sort((a, b) => b.placedAt - a.placedAt);

  function placeOrder() {
    const id = "SR" + Date.now().toString().slice(-6);
    const order = {
      id, customerName: form.name.trim(), phone: form.phone.trim(),
      type: orderType, address: orderType === "delivery" ? form.address.trim() : "",
      items: cartItems.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      total: cartTotal, status: "Order Placed", placedAt: Date.now()
    };
    addOrder(order);
    setPlacedId(id);
    setCart({});
    setScreen("confirm");
  }

  const canCheckout = form.name.trim() && form.phone.trim().length >= 7 && (orderType === "pickup" || form.address.trim());

  const Header = ({ title, back }) => (
    <div style={{ position: "sticky", top: 0, background: C.cream, borderBottom: `1px solid ${C.line}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, zIndex: 5 }}>
      {back ? <button onClick={back} style={{ background: "none", border: "none", padding: 4 }}><ArrowLeft size={20} color={C.ink} /></button> : <ChefHat size={20} color={C.mustard} />}
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.ink }}>{title}</div>
    </div>
  );

  if (screen === "track") {
    return (
      <div style={{ minHeight: "100vh", background: C.cream }}>
        <Header title="Track Order" back={() => setScreen("menu")} />
        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={trackPhone} onChange={e => setTrackPhone(e.target.value)} placeholder="Enter your phone number"
              style={{ flex: 1, padding: "11px 12px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14.5, background: C.paper }} />
            <button onClick={() => setSearched(true)} style={{ background: C.mustard, color: C.paper, border: "none", borderRadius: 8, padding: "0 16px" }}><Search size={17} /></button>
          </div>
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            {searched && myOrders.length === 0 && <p style={{ color: C.inkSoft, fontSize: 14 }}>No orders found for that number.</p>}
            {myOrders.map(o => (
              <div key={o.id} style={{ background: C.paper, border: `1px dashed ${C.line}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_MONO, fontSize: 13, color: C.inkSoft }}>
                  <span>#{o.id}</span><span>{new Date(o.placedAt).toLocaleString()}</span>
                </div>
                <div style={{ marginTop: 10 }}><StatusTracker status={o.status} type={o.type} /></div>
                <div style={{ marginTop: 10, fontSize: 13.5, color: C.ink }}>{o.items.map(i => `${i.name} ×${i.qty}`).join(", ")}</div>
                <div style={{ marginTop: 6, fontWeight: 700, color: C.ink }}>₹{o.total}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (screen === "confirm" && placedOrder) {
    return (
      <div style={{ minHeight: "100vh", background: C.cream, padding: 18 }}>
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <CheckCircle2 size={40} color={C.sage} />
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, marginTop: 8, color: C.ink }}>Order placed!</div>
          <p style={{ color: C.inkSoft, fontSize: 14 }}>The kitchen has received your order.</p>
        </div>
        <div style={{ background: C.paper, border: `1.5px dashed ${C.mustardDark}`, borderRadius: 12, padding: 18, marginTop: 20 }}>
          <div style={{ textAlign: "center", fontFamily: FONT_MONO, fontSize: 20, letterSpacing: 1, color: C.ink }}>#{placedOrder.id}</div>
          <div style={{ marginTop: 16 }}><StatusTracker status={placedOrder.status} type={placedOrder.type} /></div>
          <div style={{ marginTop: 18, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
            {placedOrder.items.map(i => (
              <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: C.ink, padding: "3px 0" }}>
                <span>{i.name} ×{i.qty}</span><span>₹{i.price * i.qty}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: 8, fontSize: 15, color: C.ink }}>
              <span>Total</span><span>₹{placedOrder.total}</span>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: C.inkSoft, display: "flex", alignItems: "center", gap: 6 }}>
            {placedOrder.type === "delivery" ? <Bike size={14} /> : <Store size={14} />}
            {placedOrder.type === "delivery" ? `Delivery to: ${placedOrder.address}` : "Pickup at the kitchen"} · Cash on {placedOrder.type}
          </div>
        </div>
        <button onClick={() => setScreen("menu")} style={{ width: "100%", marginTop: 20, background: C.mustard, color: C.paper, border: "none", borderRadius: 8, padding: "13px 0", fontWeight: 600, fontSize: 15 }}>Back to Menu</button>
      </div>
    );
  }

  if (screen === "cart" || screen === "checkout") {
    return (
      <div style={{ minHeight: "100vh", background: C.cream, paddingBottom: 100 }}>
        <Header title={screen === "cart" ? "Your Cart" : "Checkout"} back={() => setScreen(screen === "cart" ? "menu" : "cart")} />
        <div style={{ padding: 16 }}>
          {screen === "cart" ? (
            cartItems.length === 0 ? <p style={{ color: C.inkSoft, textAlign: "center", marginTop: 40 }}>Your cart is empty.</p> : (
              <>
                {cartItems.map(i => (
                  <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.line}` }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: C.ink }}>{i.name}</div>
                      <div style={{ fontSize: 13, color: C.inkSoft }}>₹{i.price} each</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button onClick={() => setQty(i.id, -1)} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={13} /></button>
                      <span style={{ minWidth: 16, textAlign: "center" }}>{i.qty}</span>
                      <button onClick={() => setQty(i.id, 1)} style={{ background: C.mustard, border: "none", borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={13} color={C.paper} /></button>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, marginBottom: 8 }}>How would you like your order?</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[["pickup", "Pickup", Store], ["delivery", "Delivery", Bike]].map(([val, label, Icon]) => (
                      <button key={val} onClick={() => setOrderType(val)} style={{
                        flex: 1, padding: "10px 0", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        border: `1.5px solid ${orderType === val ? C.mustard : C.line}`, background: orderType === val ? "#F4E4C4" : C.paper, fontWeight: 600, fontSize: 14, color: C.ink
                      }}><Icon size={15} />{label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, marginTop: 20, color: C.ink }}>
                  <span>Total</span><span>₹{cartTotal}</span>
                </div>
                <button onClick={() => setScreen("checkout")} style={{ width: "100%", marginTop: 16, background: C.mustard, color: C.paper, border: "none", borderRadius: 8, padding: "13px 0", fontWeight: 600, fontSize: 15 }}>Continue</button>
              </>
            )
          ) : (
            <>
              <label style={labelStyle}>Your name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" style={inputStyle} />
              <label style={labelStyle}>Phone number</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile number" style={inputStyle} />
              {orderType === "delivery" && (
                <>
                  <label style={labelStyle}>Delivery address</label>
                  <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="House no, street, landmark, area" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                </>
              )}
              <div style={{ background: C.paper, border: `1px dashed ${C.line}`, borderRadius: 8, padding: 12, marginTop: 16, fontSize: 13.5, color: C.inkSoft }}>
                Payment: cash on {orderType === "delivery" ? "delivery" : "pickup"} · {cartCount} item{cartCount !== 1 ? "s" : ""} · <strong style={{ color: C.ink }}>₹{cartTotal}</strong>
              </div>
              <button disabled={!canCheckout} onClick={placeOrder} style={{
                width: "100%", marginTop: 18, background: canCheckout ? C.mustard : C.line, color: canCheckout ? C.paper : C.inkSoft,
                border: "none", borderRadius: 8, padding: "13px 0", fontWeight: 600, fontSize: 15
              }}>Place Order</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // menu screen
  return (
    <div style={{ minHeight: "100vh", background: C.cream, paddingBottom: cartCount ? 90 : 20 }}>
      <div style={{ position: "sticky", top: 0, background: C.cream, borderBottom: `1px solid ${C.line}`, padding: "16px 16px 12px", zIndex: 5 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onExit} style={{ background: "none", border: "none", padding: 0 }}><ArrowLeft size={19} color={C.inkSoft} /></button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: C.ink }}>Spice Route</div>
            <div style={{ fontSize: 11, color: C.mustardDark, fontWeight: 600 }}>Cloud Kitchen</div>
          </div>
          <button onClick={() => setScreen("track")} style={{ background: "none", border: "none", fontSize: 12.5, color: C.mustardDark, fontWeight: 600 }}>Track</button>
        </div>
      </div>
      <div style={{ padding: "8px 16px" }}>
        {categories.map(cat => (
          <div key={cat} style={{ marginTop: 22 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.ink, borderBottom: `2px solid ${C.mustard}`, display: "inline-block", paddingBottom: 3 }}>{cat}</div>
            {available.filter(m => m.category === cat).map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 0", borderBottom: `1px solid ${C.line}`, gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <VegMark veg={item.veg} />
                    <span style={{ fontWeight: 600, fontSize: 14.5, color: C.ink }}>{item.name}</span>
                  </div>
                  <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 3, lineHeight: 1.4 }}>{item.desc}</div>
                  <div style={{ fontSize: 14, color: C.ink, marginTop: 4, fontWeight: 600 }}>₹{item.price}</div>
                </div>
                {cart[item.id] > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => setQty(item.id, -1)} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={14} /></button>
                    <span style={{ minWidth: 14, textAlign: "center", fontWeight: 600 }}>{cart[item.id]}</span>
                    <button onClick={() => setQty(item.id, 1)} style={{ background: C.mustard, border: "none", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={14} color={C.paper} /></button>
                  </div>
                ) : (
                  <button onClick={() => setQty(item.id, 1)} style={{ flexShrink: 0, background: C.paper, border: `1.5px solid ${C.mustard}`, color: C.mustardDark, borderRadius: 7, padding: "7px 14px", fontWeight: 700, fontSize: 13 }}>ADD</button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      {cartCount > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.ink, borderTop: `3px dashed ${C.mustard}`, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: C.cloth, fontSize: 14 }}>{cartCount} item{cartCount !== 1 ? "s" : ""} · <strong>₹{cartTotal}</strong></div>
          <button onClick={() => setScreen("cart")} style={{ background: C.mustard, color: C.paper, border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <ShoppingBag size={15} /> View Cart
          </button>
        </div>
      )}
    </div>
  );
}
const labelStyle = { display: "block", fontSize: 12.5, fontWeight: 600, color: C.inkSoft, marginTop: 14, marginBottom: 5 };
const inputStyle = { width: "100%", padding: "11px 12px", borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 14.5, background: C.paper, color: C.ink };

/* ---------------------------------- owner app ---------------------------------- */
function OwnerApp({ menu, orders, updateOrderStatus, addMenuItem, updateMenuItem, deleteMenuItem, onExit }) {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState(false);
  const [tab, setTab] = useState("orders");
  const [filter, setFilter] = useState("Active");
  const [editing, setEditing] = useState(null); // menu item being edited, or {} for new
  const [confirmDel, setConfirmDel] = useState(null);

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: C.charcoal, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <ChefHat size={30} color={C.mustard} />
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: C.cloth, marginTop: 10 }}>Kitchen Login</div>
        <input value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinErr(false); }}
          type="password" placeholder="4-digit PIN" style={{ marginTop: 18, width: 160, textAlign: "center", letterSpacing: 6, fontSize: 20, padding: "10px 0", borderRadius: 8, border: `1px solid ${C.ticketLine}`, background: C.charcoal2, color: C.cloth }} />
        {pinErr && <div style={{ color: "#E08A6A", fontSize: 12.5, marginTop: 8 }}>Incorrect PIN, try again.</div>}
        <button onClick={() => pin === OWNER_PIN ? setAuthed(true) : setPinErr(true)} style={{ marginTop: 16, background: C.mustard, color: C.charcoal, border: "none", borderRadius: 8, padding: "10px 26px", fontWeight: 700 }}>Enter</button>
        <div style={{ fontSize: 11.5, color: "#8B8377", marginTop: 12 }}>Demo PIN: {OWNER_PIN}</div>
        <button onClick={onExit} style={{ marginTop: 26, background: "none", border: "none", color: "#8B8377", fontSize: 13 }}>← Back</button>
      </div>
    );
  }

  const activeStatuses = ["Order Placed", "Preparing", "Out for Delivery", "Ready for Pickup"];
  const filtered = orders.filter(o => {
    if (filter === "Active") return activeStatuses.includes(o.status);
    if (filter === "All") return true;
    return o.status === filter;
  }).sort((a, b) => b.placedAt - a.placedAt);

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const completedToday = orders.filter(o => (o.status === "Completed" || o.status === "Delivered") && o.placedAt >= todayStart.getTime());
  const newCount = orders.filter(o => o.status === "Order Placed").length;
  const activeCount = orders.filter(o => activeStatuses.includes(o.status)).length;
  const salesToday = completedToday.reduce((s, o) => s + o.total, 0);

  function nextStep(order) {
    const steps = order.type === "delivery" ? DELIVERY_STEPS : PICKUP_STEPS;
    const idx = steps.indexOf(order.status);
    if (idx < 0 || idx >= steps.length - 1) return null;
    return steps[idx + 1];
  }

  return (
    <div style={{ minHeight: "100vh", background: C.charcoal }}>
      <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.charcoal2}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ChefHat size={19} color={C.mustard} />
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, color: C.cloth }}>Spice Route — Kitchen</div>
        </div>
        <button onClick={() => { setAuthed(false); onExit(); }} style={{ background: "none", border: "none", color: "#8B8377" }}><LogOut size={18} /></button>
      </div>
      <div style={{ display: "flex", gap: 4, padding: "12px 18px 0" }}>
        {["orders", "menu"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? C.mustard : "transparent", color: tab === t ? C.charcoal : C.cloth,
            border: `1px solid ${tab === t ? C.mustard : C.charcoal2}`, borderRadius: 7, padding: "7px 16px", fontWeight: 600, fontSize: 13.5, textTransform: "capitalize"
          }}>{t}</button>
        ))}
      </div>

      {tab === "orders" ? (
        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            {[["New", newCount], ["In progress", activeCount], ["Done today", completedToday.length], ["Sales today", "₹" + salesToday]].map(([label, val]) => (
              <div key={label} style={{ background: C.charcoal2, borderRadius: 8, padding: "8px 14px", flex: "1 1 120px" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.cloth }}>{val}</div>
                <div style={{ fontSize: 11.5, color: "#8B8377" }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["Active", "All", "Completed", "Delivered", "Cancelled"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                background: filter === f ? C.mustard : "transparent", color: filter === f ? C.charcoal : "#C9BF9F",
                border: `1px solid ${filter === f ? C.mustard : C.charcoal2}`, borderRadius: 20, padding: "5px 13px", fontSize: 12.5, fontWeight: 600
              }}>{f}</button>
            ))}
          </div>
          {filtered.length === 0 && <div style={{ color: "#8B8377", textAlign: "center", marginTop: 40 }}>No orders here yet.</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {filtered.map(o => {
              const next = nextStep(o);
              return (
                <div key={o.id} style={{ background: C.ticket, borderRadius: 10, borderBottom: `4px dashed ${C.ticketLine}`, padding: 14, color: C.ink }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT_MONO, fontSize: 13.5 }}>
                    <strong>#{o.id}</strong><span style={{ color: C.inkSoft }}>{new Date(o.placedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13.5, display: "flex", alignItems: "center", gap: 6, color: C.inkSoft }}>
                    {o.type === "delivery" ? <Bike size={13} /> : <Store size={13} />}
                    {o.customerName || "Customer"} · {o.phone}
                  </div>
                  {o.type === "delivery" && o.address && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 3, display: "flex", gap: 5 }}><MapPin size={12} style={{ marginTop: 1, flexShrink: 0 }} />{o.address}</div>}
                  <div style={{ marginTop: 10, borderTop: `1px solid ${C.ticketLine}`, paddingTop: 8 }}>
                    {o.items.map(i => (
                      <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span>{i.name} ×{i.qty}</span><span>₹{i.price * i.qty}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: 6, fontSize: 14 }}>
                    <span>Total</span><span>₹{o.total}</span>
                  </div>
                  <div style={{ marginTop: 10, background: "#00000010", borderRadius: 6, padding: "4px 8px", fontSize: 12.5, fontWeight: 600, color: o.status === "Cancelled" ? C.chili : C.mustardDark, display: "inline-block" }}>{o.status}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    {next && (
                      <button onClick={() => updateOrderStatus(o.id, next)} style={{ flex: 1, background: C.mustard, color: C.paper, border: "none", borderRadius: 7, padding: "9px 0", fontWeight: 700, fontSize: 13 }}>
                        Mark {next}
                      </button>
                    )}
                    {["Order Placed", "Preparing"].includes(o.status) && (
                      <button onClick={() => updateOrderStatus(o.id, "Cancelled")} style={{ background: "transparent", border: `1px solid ${C.chili}`, color: C.chili, borderRadius: 7, padding: "9px 12px", fontSize: 12.5 }}>Cancel</button>
                    )}
                    {!next && o.status !== "Cancelled" && <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.sage, fontWeight: 600, fontSize: 13, gap: 6 }}><PackageCheck size={15} /> Complete</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <MenuTab menu={menu} editing={editing} setEditing={setEditing} confirmDel={confirmDel} setConfirmDel={setConfirmDel}
          addMenuItem={addMenuItem} updateMenuItem={updateMenuItem} deleteMenuItem={deleteMenuItem} />
      )}
    </div>
  );
}

function MenuTab({ menu, editing, setEditing, confirmDel, setConfirmDel, addMenuItem, updateMenuItem, deleteMenuItem }) {
  const categories = [...new Set(menu.map(m => m.category))];
  const blank = { name: "", desc: "", price: "", category: categories[0] || "Starters", veg: true, available: true };
  const form = editing && editing.id ? editing : { ...blank, ...editing };

  function save() {
    if (!form.name.trim() || !form.price) return;
    const item = { ...form, id: form.id || "m" + Date.now(), price: Number(form.price) };
    if (form.id) updateMenuItem(item); else addMenuItem(item);
    setEditing(null);
  }

  return (
    <div style={{ padding: 18 }}>
      <button onClick={() => setEditing(blank)} style={{ background: C.mustard, color: C.charcoal, border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: 13.5, display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
        <Plus size={15} /> Add Item
      </button>

      {editing && (
        <div style={{ background: C.charcoal2, borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input placeholder="Dish name" value={form.name} onChange={e => setEditing({ ...form, name: e.target.value })} style={darkInput} />
            <input placeholder="Price (₹)" type="number" value={form.price} onChange={e => setEditing({ ...form, price: e.target.value })} style={darkInput} />
            <input placeholder="Category" list="cats" value={form.category} onChange={e => setEditing({ ...form, category: e.target.value })} style={darkInput} />
            <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
            <select value={form.veg ? "veg" : "nonveg"} onChange={e => setEditing({ ...form, veg: e.target.value === "veg" })} style={darkInput}>
              <option value="veg">Veg</option><option value="nonveg">Non-Veg</option>
            </select>
          </div>
          <input placeholder="Short description" value={form.desc} onChange={e => setEditing({ ...form, desc: e.target.value })} style={{ ...darkInput, width: "100%", marginTop: 10 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, color: C.cloth, fontSize: 13.5 }}>
            <input type="checkbox" checked={form.available} onChange={e => setEditing({ ...form, available: e.target.checked })} /> Available to order
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={save} style={{ background: C.mustard, color: C.charcoal, border: "none", borderRadius: 7, padding: "9px 18px", fontWeight: 700 }}>Save</button>
            <button onClick={() => setEditing(null)} style={{ background: "transparent", border: `1px solid ${C.ticketLine}`, color: C.cloth, borderRadius: 7, padding: "9px 18px" }}>Cancel</button>
          </div>
        </div>
      )}

      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, color: C.mustard, marginBottom: 8 }}>{cat}</div>
          {menu.filter(m => m.category === cat).map(item => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, background: C.charcoal2, borderRadius: 8, padding: "10px 12px", marginBottom: 6, opacity: item.available ? 1 : 0.5 }}>
              <VegMark veg={item.veg} />
              <div style={{ flex: 1 }}>
                <div style={{ color: C.cloth, fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                <div style={{ color: "#8B8377", fontSize: 12 }}>₹{item.price} {!item.available && "· hidden from menu"}</div>
              </div>
              <button onClick={() => updateMenuItem({ ...item, available: !item.available })} style={{ background: "none", border: `1px solid ${C.ticketLine}`, color: C.cloth, borderRadius: 6, padding: "5px 9px", fontSize: 11.5 }}>
                {item.available ? "Hide" : "Show"}
              </button>
              <button onClick={() => setEditing(item)} style={{ background: "none", border: "none", color: C.cloth }}><Pencil size={15} /></button>
              {confirmDel === item.id ? (
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => { deleteMenuItem(item.id); setConfirmDel(null); }} style={{ background: C.chili, border: "none", color: "#fff", borderRadius: 6, padding: "5px 8px", fontSize: 11 }}>Delete</button>
                  <button onClick={() => setConfirmDel(null)} style={{ background: "none", border: `1px solid ${C.ticketLine}`, color: C.cloth, borderRadius: 6, padding: "5px 8px", fontSize: 11 }}>No</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDel(item.id)} style={{ background: "none", border: "none", color: "#B06A5A" }}><Trash2 size={15} /></button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
const darkInput = { padding: "9px 10px", borderRadius: 7, border: `1px solid ${C.ticketLine}`, background: C.charcoal, color: C.cloth, fontSize: 13.5 };

/* ---------------------------------- root ---------------------------------- */
export default function App() {
  const [role, setRole] = useState("landing");
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [m, o] = await Promise.all([readKey("kitchen-menu", DEFAULT_MENU), readKey("kitchen-orders", [])]);
      if (mounted) { setMenu(m); setOrders(o); setLoading(false); }
    })();
    const poll = setInterval(async () => {
      try { const o = await storageGet("kitchen-orders"); if (mounted) setOrders(JSON.parse(o.value)); } catch {}
      try { const m = await storageGet("kitchen-menu"); if (mounted) setMenu(JSON.parse(m.value)); } catch {}
    }, 4000);
    return () => { mounted = false; clearInterval(poll); };
  }, []);

  const addOrder = (order) => setOrders(prev => { const next = [...prev, order]; writeKey("kitchen-orders", next); return next; });
  const updateOrderStatus = (id, status) => setOrders(prev => { const next = prev.map(o => o.id === id ? { ...o, status } : o); writeKey("kitchen-orders", next); return next; });
  const addMenuItem = (item) => setMenu(prev => { const next = [...prev, item]; writeKey("kitchen-menu", next); return next; });
  const updateMenuItem = (item) => setMenu(prev => { const next = prev.map(m => m.id === item.id ? item : m); writeKey("kitchen-menu", next); return next; });
  const deleteMenuItem = (id) => setMenu(prev => { const next = prev.filter(m => m.id !== id); writeKey("kitchen-menu", next); return next; });

  return (
    <div style={{ fontFamily: FONT_BODY, minHeight: "100vh" }}>
      <style>{GLOBAL_CSS}</style>
      {loading ? (
        <div style={{ minHeight: "100vh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChefHat size={26} color={C.mustard} />
        </div>
      ) : role === "landing" ? (
        <Landing onSelect={setRole} />
      ) : role === "customer" ? (
        <CustomerApp menu={menu} orders={orders} addOrder={addOrder} onExit={() => setRole("landing")} />
      ) : (
        <OwnerApp menu={menu} orders={orders} updateOrderStatus={updateOrderStatus}
          addMenuItem={addMenuItem} updateMenuItem={updateMenuItem} deleteMenuItem={deleteMenuItem}
          onExit={() => setRole("landing")} />
      )}
    </div>
  );
}
