import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product, Category, OrderItem, Order } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Plus, Minus, X, Check, Send, Coffee, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function OrderingSystem() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    const qProducts = query(collection(db, 'products'), where('isAvailable', '==', true));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    const qCats = query(collection(db, 'categories'), orderBy('displayOrder'));
    const unsubCats = onSnapshot(qCats, (snapshot) => {
      setCategories([{ id: 'all', name: 'All', displayOrder: 0 }, ...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category))]);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'categories'));

    return () => { unsubProducts(); unsubCats(); };
  }, []);

  const addToCart = (product: Product, size: 'M' | 'L' | 'XL' = 'L') => {
    const price = size === 'M' ? product.priceM : size === 'L' ? product.priceL : product.priceXL;
    if (price === undefined) return;

    const existingIndex = cart.findIndex(item => item.productId === product.id && item.size === size);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        size,
        sugarLevel: 'Normal',
        iceLevel: 'Normal',
        toppings: [],
        price,
        quantity: 1
      }]);
    }
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    if (newCart[index].quantity > 1) {
      newCart[index].quantity -= 1;
    } else {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const checkout = async () => {
    if (!user) {
      alert('Please login to place an order');
      return;
    }
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        customerName: user.displayName,
        items: cart,
        totalAmount,
        status: 'PENDING',
        orderNumber: Math.floor(1000 + Math.random() * 9000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setCart([]);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 3000);
      setIsCartOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="flex w-full h-full">
      {/* 1. Sidebar Categories */}
      <aside className="w-56 bg-white border-r border-line flex flex-col pt-4 overflow-y-auto no-scrollbar">
        {categories.map(cat => (
          <div
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            className={`sidebar-item ${selectedCategory === cat.name ? 'active' : ''}`}
          >
            {cat.name}
          </div>
        ))}
      </aside>

      {/* 2. Main Menu Grid */}
      <section className="flex-1 overflow-y-auto bg-bg-base p-6 no-scrollbar">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-text-main tracking-tight uppercase">{selectedCategory}</h1>
            <p className="text-sm text-text-muted">鮮茶道為您精心挑選優質茶葉</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-text-muted font-bold uppercase tracking-wider">
            <Clock size={12} /> 更新於: {new Date().toLocaleTimeString()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProducts.map(product => (
            <motion.div 
              layout
              key={product.id} 
              className="fresh-tea-card group p-4 flex flex-col cursor-pointer"
              onClick={() => addToCart(product, product.priceL ? 'L' : 'M')}
            >
              <div className="aspect-video bg-bg-base rounded-lg mb-4 flex items-center justify-center text-gray-300 group-hover:bg-primary/5 transition-colors">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Coffee size={40} className="opacity-10 group-hover:scale-110 transition-transform" />
                )}
              </div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-base text-text-main">{product.name}</h3>
                <span className="text-primary font-bold">${product.priceL || product.priceM}</span>
              </div>
              <p className="text-text-muted text-xs line-clamp-2 leading-relaxed">
                {product.description || '由專業職人現場沖泡，呈現茶葉最純粹的原味與香氣。'}
              </p>
              
              <div className="mt-4 flex justify-end">
                <button className="w-8 h-8 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center">
                  <Plus size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. Right Cart Panel */}
      <aside className="w-80 bg-white border-l border-line flex flex-col shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">
        <div className="p-6 border-b border-line flex justify-between items-center">
          <h2 className="text-lg font-black tracking-tight text-text-main">當前點單</h2>
          <span className="text-xs bg-bg-base text-text-muted px-2 py-1 rounded font-bold">#ORD-{Math.floor(Math.random() * 1000)}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-muted gap-4 opacity-30">
              <Coffee size={48} strokeWidth={1} />
              <p className="text-xs font-bold uppercase tracking-widest text-center">尚未選購商品<br/>請從選單選擇</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.productId}-${item.size}-${idx}`} className="flex flex-col p-3 rounded-lg border border-line bg-bg-base/30 text-sm">
                <div className="flex justify-between font-bold mb-1">
                  <span>{item.name}</span>
                  <span>${item.price * item.quantity}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-text-muted">
                  <span>{item.size} / {item.sugarLevel} / {item.iceLevel}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(idx)} className="p-1 hover:bg-white rounded border border-line"><Minus size={10} /></button>
                    <span className="font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => addToCart(products.find(p => p.id === item.productId)!, item.size)} className="p-1 hover:bg-white rounded border border-line"><Plus size={10} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-primary/5 border-t border-line space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-text-muted uppercase font-bold">
              <span>小計 Subtotal</span>
              <span>${totalAmount}</span>
            </div>
            <div className="flex justify-between text-xl font-black text-primary">
              <span>總計 Total</span>
              <span>${totalAmount}</span>
            </div>
          </div>
          
          <button 
            disabled={cart.length === 0 || isSubmitting}
            onClick={checkout}
            className="w-full btn-primary !rounded-lg py-4 text-lg"
          >
            {isSubmitting ? '處理中...' : '確認結帳'}
          </button>
        </div>
      </aside>

      {/* Success Toast */}
      <AnimatePresence>
        {orderSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-primary-dark text-white px-8 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3 font-bold border-b-4 border-accent"
          >
            <Check size={20} className="text-accent" /> 訂單已成功送出！
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
