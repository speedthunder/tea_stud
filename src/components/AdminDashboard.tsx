import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product, Category, Order, OrderStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Coffee, Plus, Trash2, Edit2, RotateCcw, CheckCircle, Clock, Ban, Package, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const { isAdmin, user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // States for adding/editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({ isAvailable: true });

  useEffect(() => {
    if (!isAdmin || !user) return;

    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));

    let isInitialLoad = true;
    const qProducts = query(collection(db, 'products'), orderBy('name'));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const dbProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(dbProducts);
      if (isInitialLoad && dbProducts.length === 0) {
        seedData(true).catch(console.error);
      }
      isInitialLoad = false;
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    const qCats = query(collection(db, 'categories'), orderBy('displayOrder'));
    const unsubCats = onSnapshot(qCats, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'categories'));

    return () => { unsubOrders(); unsubProducts(); unsubCats(); };
  }, [isAdmin, user]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><RotateCcw className="animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="bg-white p-12 rounded-3xl border-2 border-line text-center space-y-4">
        <Ban size={48} className="mx-auto text-red-500 opacity-20" />
        <h2 className="text-xl font-black text-text-main uppercase tracking-tight">存取受限</h2>
        <p className="text-text-muted">您沒有管理員權限可以查看此頁面。</p>
      </div>
    );
  }

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status, updatedAt: serverTimestamp() });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'orders');
    }
  };

  const seedData = async (force = false) => {
    if (!force && products.length > 0) return;
    
    const cats = [
      '奶茶繽紛樂', 
      '鮮奶系列', 
      '奶蓋系列', 
      '季節限定',
      '果然纖滋味', 
      '無咖啡因', 
      '鮮淬茶', 
      '雨林聯盟認證茶葉',
      '特等茶'
    ];
    
    for (let i = 0; i < cats.length; i++) {
        await addDoc(collection(db, 'categories'), { name: cats[i], displayOrder: i + 1 });
    }

    const initialProducts = [
      // 奶茶繽紛樂
      { name: '熊貓黑糖珍珠奶茶', category: '奶茶繽紛樂', priceM: 50, priceL: 60, priceXL: 100, isAvailable: true, description: '鮮茶道招牌！Q彈珍珠與黑糖的完美結合。' },
      { name: '琥珀奶茶', category: '奶茶繽紛樂', priceM: 40, priceL: 50, isAvailable: true },
      { name: '茉香奶茶', category: '奶茶繽紛樂', priceM: 40, priceL: 50, isAvailable: true },
      { name: '伯爵奶茶', category: '奶茶繽紛樂', priceM: 40, priceL: 50, isAvailable: true },
      { name: '沖繩黑糖風味奶茶', category: '奶茶繽紛樂', priceL: 45, priceXL: 85, isAvailable: true },
      { name: '焙茶烤奶', category: '奶茶繽紛樂', priceM: 40, priceL: 50, isAvailable: true },
      { name: '珍珠奶茶', category: '奶茶繽紛樂', priceM: 40, priceL: 50, priceXL: 90, isAvailable: true },
      { name: '仙草凍奶茶', category: '奶茶繽紛樂', priceM: 40, priceL: 50, priceXL: 90, isAvailable: true },
      { name: '布丁奶茶', category: '奶茶繽紛樂', priceL: 55, isAvailable: true },
      { name: '紅豆玄米奶茶', category: '奶茶繽紛樂', priceL: 60, isAvailable: true },

      // 鮮奶系列
      { name: '聖塔路黑可可', category: '鮮奶系列', priceL: 55, priceXL: 95, isAvailable: true },
      { name: '紅茶拿鐵', category: '鮮奶系列', priceM: 45, priceL: 60, priceXL: 100, isAvailable: true },
      { name: '綠茶拿鐵', category: '鮮奶系列', priceM: 45, priceL: 60, priceXL: 100, isAvailable: true },
      { name: '抹茶拿鐵', category: '鮮奶系列', priceM: 45, priceL: 60, priceXL: 100, isAvailable: true },
      { name: '伯爵拿鐵', category: '鮮奶系列', priceM: 45, priceL: 60, priceXL: 100, isAvailable: true },
      { name: '抹茶紅豆珍珠', category: '鮮奶系列', priceL: 65, priceXL: 105, isAvailable: true },

      // 奶蓋系列
      { name: '琥珀奶蓋', category: '奶蓋系列', priceL: 50, isAvailable: true },
      { name: '焙茶奶蓋', category: '奶蓋系列', priceL: 55, isAvailable: true },
      { name: '白桃風味烏龍奶蓋', category: '奶蓋系列', priceL: 55, isAvailable: true },

      // 季節限定
      { name: '翡翠檸檬冰鑽', category: '季節限定', priceL: 55, priceXL: 95, isAvailable: true },
      { name: '可可冰鑽', category: '季節限定', priceL: 55, priceXL: 95, isAvailable: true },
      { name: '抹茶冰鑽', category: '季節限定', priceL: 55, priceXL: 95, isAvailable: true },

      // 果然纖滋味
      { name: '鳳梨清茶', category: '果然纖滋味', priceL: 60, isAvailable: true },
      { name: '鮮果雙Q綠茶', category: '果然纖滋味', priceL: 60, priceXL: 100, isAvailable: true },
      { name: '招牌水果茶', category: '果然纖滋味', priceL: 65, isAvailable: true },
      { name: '荔枝QQ金萱', category: '果然纖滋味', priceL: 45, priceXL: 85, isAvailable: true },
      { name: '墾丁冰茶', category: '果然纖滋味', priceL: 45, priceXL: 85, isAvailable: true },
      { name: '養樂多綠茶', category: '果然纖滋味', priceL: 50, isAvailable: true },
      { name: '芭樂檸檬玉露', category: '果然纖滋味', priceL: 60, isAvailable: true },
      { name: '橙香金萱', category: '果然纖滋味', priceL: 65, isAvailable: true },

      // 無咖啡因
      { name: '黑糖珍珠撞奶', category: '無咖啡因', priceM: 50, priceL: 60, isAvailable: true },
      { name: '黑糖珍珠厚鮮奶', category: '無咖啡因', priceL: 80, isAvailable: true },
      { name: '水晶冬瓜茶', category: '無咖啡因', priceL: 40, priceXL: 80, isAvailable: true },
      { name: '檸檬CC', category: '無咖啡因', priceL: 40, priceXL: 80, isAvailable: true },
      { name: '藍莓果茶', category: '無咖啡因', priceL: 45, isAvailable: true },
      { name: '鮮桔檸檬飲', category: '無咖啡因', priceM: 40, priceL: 50, priceXL: 90, isAvailable: true },
      { name: '蘆薈好蜜', category: '無咖啡因', priceM: 50, priceL: 55, priceXL: 95, isAvailable: true },
      { name: '冬瓜檸檬', category: '無咖啡因', priceL: 60, priceXL: 100, isAvailable: true },
      { name: '蜂蜜檸好', category: '無咖啡因', priceM: 55, priceL: 65, priceXL: 105, isAvailable: true },
      { name: '紅心芭樂梅', category: '無咖啡因', priceL: 70, isAvailable: true },
      { name: '紅心芭樂汁', category: '無咖啡因', priceL: 65, isAvailable: true },
      { name: '橙美荔', category: '無咖啡因', priceL: 65, isAvailable: true },
      { name: '薑汁撞奶', category: '無咖啡因', priceL: 65, isAvailable: true },
      { name: '黑糖薑茶/桂圓紅棗茶', category: '無咖啡因', priceL: 55, isAvailable: true },
      { name: '鳳梨冰鑽', category: '無咖啡因', priceL: 60, priceXL: 100, isAvailable: true },

      // 鮮淬茶
      { name: '古香烏龍', category: '鮮淬茶', priceL: 30, priceXL: 65, isAvailable: true },
      { name: '阿里山冰茶', category: '鮮淬茶', priceL: 30, priceXL: 65, isAvailable: true },
      { name: '頂級茉莉綠茶', category: '鮮淬茶', priceL: 30, priceXL: 65, isAvailable: true },
      { name: '琥珀紅茶', category: '鮮淬茶', priceL: 30, priceXL: 65, isAvailable: true },
      { name: '烏龍綠茶', category: '鮮淬茶', priceL: 30, priceXL: 65, isAvailable: true },
      { name: '伯爵紅茶', category: '鮮淬茶', priceL: 30, priceXL: 65, isAvailable: true },
      { name: '凍頂烏龍茶', category: '鮮淬茶', priceL: 35, priceXL: 70, isAvailable: true },
      { name: '文山清茶', category: '鮮淬茶', priceL: 35, priceXL: 70, isAvailable: true },
      { name: '茶花綠茶', category: '鮮淬茶', priceL: 35, priceXL: 70, isAvailable: true },
      { name: '炭燒焙茶', category: '鮮淬茶', priceL: 35, priceXL: 70, isAvailable: true },
      { name: '日式玄米茶', category: '鮮淬茶', priceL: 35, priceXL: 70, isAvailable: true },
      { name: '鮮露金萱茶', category: '鮮淬茶', priceL: 35, priceXL: 70, isAvailable: true },

      // 雨林聯盟認證茶葉
      { name: '四季春', category: '雨林聯盟認證茶葉', priceL: 35, isAvailable: true },
      { name: '蜜香紅茶/玉露煎茶', category: '雨林聯盟認證茶葉', priceL: 40, isAvailable: true },
      { name: '薄綠荷茶', category: '雨林聯盟認證茶葉', priceL: 40, isAvailable: true },
      { name: '東方美人茶', category: '雨林聯盟認證茶葉', priceL: 40, isAvailable: true },
      { name: '蜜香果茶', category: '雨林聯盟認證茶葉', priceL: 45, isAvailable: true },
      { name: '香檳烏龍', category: '雨林聯盟認證茶葉', priceL: 55, isAvailable: true },
      { name: '寒天四季奶青', category: '雨林聯盟認證茶葉', priceL: 60, isAvailable: true },

      // 特等茶
      { name: '阿里山里佳甘露', category: '特等茶', priceL: 45, isAvailable: true },
      { name: '日月潭紅玉', category: '特等茶', priceL: 45, isAvailable: true },
    ];

    for (const p of initialProducts) {
      await addDoc(collection(db, 'products'), p);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setProductForm({ isAvailable: true });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm(product);
    setIsModalOpen(true);
  };

  const saveProduct = async () => {
    if (!productForm.name || !productForm.category) return;
    try {
      const data = {
        ...productForm,
        priceM: Number(productForm.priceM) || 0,
        priceL: Number(productForm.priceL) || 0,
        priceXL: Number(productForm.priceXL) || 0,
      };

      if (editingProduct) {
        // Update
        const { id, ...updateData } = data as Product;
        await updateDoc(doc(db, 'products', id), updateData);
      } else {
        // Add
        await addDoc(collection(db, 'products'), data);
      }
      
      setIsModalOpen(false);
      setProductForm({ isAvailable: true });
      setEditingProduct(null);
    } catch (err) {
      handleFirestoreError(err, editingProduct ? OperationType.UPDATE : OperationType.CREATE, 'products');
    }
  };

  const toggleProductAvailability = async (product: Product) => {
    try {
      await updateDoc(doc(db, 'products', product.id), { isAvailable: !product.isAvailable });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'products');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('確定要刪除此商品嗎？')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'products');
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return <Clock className="text-yellow-500" size={18} />;
      case 'PREPARING': return <RotateCcw className="text-blue-500 animate-spin-slow" size={18} />;
      case 'READY': return <Package className="text-green-500" size={18} />;
      case 'COMPLETED': return <CheckCircle className="text-gray-400" size={18} />;
      case 'CANCELLED': return <Ban className="text-red-500" size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-8 rounded-2xl shadow-sm border border-line">
        <div>
          <h1 className="text-2xl font-black text-text-main tracking-tight uppercase">系統管理後台</h1>
          <p className="text-text-muted text-sm font-medium">即時監控訂單流量與維護產品菜單</p>
        </div>
        <div className="flex gap-2 bg-bg-base p-1.5 rounded-xl border border-line">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'orders' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
          >
            訂單中心 ({orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length})
          </button>
          <button 
            onClick={() => setActiveTab('menu')}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${activeTab === 'menu' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
          >
            菜單設定
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => (
            <motion.div 
              layout
              key={order.id} 
              className={`fresh-tea-card flex flex-col p-1 border-2 ${order.status === 'READY' ? 'border-primary' : 'border-line'} ${order.status === 'COMPLETED' ? 'opacity-40' : ''}`}
            >
              <div className="p-4 border-b border-line flex justify-between items-center bg-bg-base/30 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <span className="bg-primary text-white px-2 py-1 rounded text-[10px] font-black tracking-tighter">#{order.orderNumber}</span>
                  <span className="text-xs font-bold text-text-main">{order.customerName}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-full border border-line">
                  {getStatusIcon(order.status)}
                  <span className="text-[10px] font-black uppercase tracking-tighter">{order.status}</span>
                </div>
              </div>
              
              <div className="p-4 flex-1 space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center group">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-main">{item.quantity}x {item.name}</span>
                      <span className="text-[10px] text-text-muted font-medium uppercase">{item.size} | {item.sugarLevel} | {item.iceLevel}</span>
                    </div>
                    {item.toppings?.length > 0 && (
                      <span className="text-[10px] bg-accent/20 text-text-main px-1.5 py-0.5 rounded font-bold">配料</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 bg-bg-base/20 border-t border-line flex gap-2">
                {order.status === 'PENDING' && (
                  <button onClick={() => updateOrderStatus(order.id, 'PREPARING')} className="flex-1 bg-primary text-white py-2.5 rounded-lg text-xs font-bold hover:bg-primary-dark transition-all shadow-sm">
                    開始製作
                  </button>
                )}
                {order.status === 'PREPARING' && (
                  <button onClick={() => updateOrderStatus(order.id, 'READY')} className="flex-1 bg-blue-500 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-blue-600 transition-all shadow-sm">
                    完成製作
                  </button>
                )}
                {order.status === 'READY' && (
                  <button onClick={() => updateOrderStatus(order.id, 'COMPLETED')} className="flex-1 bg-text-main text-white py-2.5 rounded-lg text-xs font-bold hover:bg-black transition-all shadow-sm">
                    確認取餐
                  </button>
                )}
                {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                  <button onClick={() => updateOrderStatus(order.id, 'CANCELLED')} className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-line">
                    <Ban size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {orders.length === 0 && (
            <div className="col-span-full py-24 bg-white rounded-3xl border-2 border-dashed border-line flex flex-col items-center justify-center text-text-muted">
              <Clock size={48} className="mb-4 opacity-10" />
              <p className="font-bold uppercase tracking-widest text-xs">目前無待處理訂單</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-line overflow-hidden">
          <div className="p-8 border-b border-line flex justify-between items-center bg-bg-base/30">
            <div>
              <h3 className="text-lg font-black text-text-main tracking-tight uppercase">飲品菜單維護</h3>
              <p className="text-xs text-text-muted font-medium">總計 {products.length} 個品項</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={async () => {
                  if (window.confirm('確定要清空所有菜單並重新匯入最新預設資料嗎？這將刪除所有現有商品與分類！')) {
                    const confirm2 = window.confirm('這是一個不可逆的操作，確定繼續嗎？');
                    if (confirm2) {
                      for (const p of products) {
                        await deleteDoc(doc(db, 'products', p.id));
                      }
                      for (const c of categories) {
                        await deleteDoc(doc(db, 'categories', c.id));
                      }
                      await seedData(true);
                    }
                  }
                }} 
                className="btn-secondary !py-2 !px-4 text-xs !bg-red-50 !text-red-600 hover:!bg-red-100 !border-red-200"
              >
                <RotateCcw size={16} className="inline-block mr-1" /> 重設菜單
              </button>
              <button 
                onClick={openAddModal}
                className="btn-primary !py-2 !px-4 text-xs"
              >
                <Plus size={16} /> 新增商品
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase font-black text-text-muted border-b border-line tracking-[0.2em]">
                  <th className="px-8 py-5">狀態 Status</th>
                  <th className="px-8 py-5">品名 Product Name</th>
                  <th className="px-8 py-5">分類 Category</th>
                  <th className="px-8 py-5">價格 Price (L)</th>
                  <th className="px-8 py-5">設定 Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-bg-base/30 transition-colors group">
                    <td className="px-8 py-5">
                      <button 
                        onClick={() => toggleProductAvailability(p)}
                        className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${p.isAvailable ? 'bg-primary' : 'bg-gray-200'}`}
                      >
                        <div className={`bg-white w-3 h-3 rounded-full shadow-sm transition-transform ${p.isAvailable ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </td>
                    <td className="px-8 py-5 font-bold text-text-main">{p.name}</td>
                    <td className="px-8 py-5">
                      <span className="bg-line/40 text-text-muted px-2 py-1 rounded text-[10px] uppercase font-black tracking-widest">{p.category}</span>
                    </td>
                    <td className="px-8 py-5 text-primary font-black text-lg">${p.priceL}</td>
                    <td className="px-8 py-5">
                      <div className="flex gap-1">
                        <button 
                          onClick={() => openEditModal(p)}
                          className="p-2 text-text-muted hover:text-primary hover:bg-white rounded-lg transition-all border border-transparent hover:border-line"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteProduct(p.id)} className="p-2 text-text-muted hover:text-red-500 hover:bg-white rounded-lg transition-all border border-transparent hover:border-line">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal (Polished) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-text-main/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white rounded-[2rem] p-10 w-full max-w-xl relative z-[110] shadow-2xl border-b-8 border-accent"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  {editingProduct ? <Edit2 size={28} /> : <Plus size={28} />}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-text-main tracking-tight uppercase">
                    {editingProduct ? '編輯商品項目' : '新增商品項目'}
                  </h2>
                  <p className="text-sm text-text-muted font-medium">
                    {editingProduct ? '修改此商品的詳細資訊' : '請輸入完整的商品資訊'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">商品名稱 Item Name</label>
                  <input 
                    type="text" 
                    placeholder="請輸入名稱" 
                    className="w-full bg-bg-base border-2 border-line rounded-xl px-5 py-4 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold"
                    value={productForm.name || ''}
                    onChange={e => setProductForm({...productForm, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">所屬分類 Category</label>
                  <select 
                    className="w-full bg-bg-base border-2 border-line rounded-xl px-5 py-4 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold"
                    value={productForm.category || ''}
                    onChange={e => setProductForm({...productForm, category: e.target.value})}
                  >
                    <option value="">選擇分類</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">M 價格 Price</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    className="w-full bg-bg-base border-2 border-line rounded-xl px-5 py-4 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-primary"
                    value={productForm.priceM || ''}
                    onChange={e => setProductForm({...productForm, priceM: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">L 價格 Price</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    className="w-full bg-bg-base border-2 border-line rounded-xl px-5 py-4 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-primary text-lg"
                    value={productForm.priceL || ''}
                    onChange={e => setProductForm({...productForm, priceL: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">XL 價格 Price</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    className="w-full bg-bg-base border-2 border-line rounded-xl px-5 py-4 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-primary"
                    value={productForm.priceXL || ''}
                    onChange={e => setProductForm({...productForm, priceXL: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-8">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 px-8 py-4 rounded-xl border-2 border-line font-black uppercase text-xs tracking-widest hover:bg-bg-base transition-all">
                  取消返回
                </button>
                <button onClick={saveProduct} className="flex-1 bg-primary text-white font-black uppercase text-xs tracking-widest py-4 rounded-xl hover:bg-primary-dark shadow-xl shadow-primary/30 transition-all active:scale-95">
                  {editingProduct ? '確認修改商品' : '確認發佈商品'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
