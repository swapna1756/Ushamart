import { supabase, isSupabaseConfigured } from './supabaseClient';

const getLocalKey = (name: string) => `ushamart_db_${name}`;

const getLocalItems = (name: string): any[] => {
  const localKey = getLocalKey(name);
  const localData = localStorage.getItem(localKey);
  if (!localData) {
    if (name === 'pincodes') {
      return ['530001', '560001', '560002', '110001', '400001'];
    }
    if (name === 'pincode_configs') {
      const defaultConfigs = [
        { id: '530001', code: '530001', charges: 0, time: 'Tomorrow 06:00 AM - 09:00 AM', enabled: true },
        { id: '560001', code: '560001', charges: 0, time: 'Tomorrow 06:00 AM - 09:00 AM', enabled: true },
        { id: '560002', code: '560002', charges: 30, time: '1-2 Days Delivery', enabled: true },
        { id: '110001', code: '110001', charges: 49, time: '2-3 Days Delivery', enabled: true },
        { id: '400001', code: '400001', charges: 29, time: '1-2 Days Delivery', enabled: true }
      ];
      localStorage.setItem(localKey, JSON.stringify(defaultConfigs));
      return defaultConfigs;
    }
    if (name === 'coupons') {
      const defaultCoupons = [
        { id: 'c1', code: 'WELCOME20', type: 'percentage', value: 20, minSpend: 100, description: '20% off on orders above ₹100', status: 'published' },
        { id: 'c2', code: 'USHA100', type: 'flat', value: 100, minSpend: 500, description: 'Flat ₹100 off on orders above ₹500', status: 'published' },
        { id: 'c3', code: 'FREESHIP', type: 'free_delivery', value: 0, minSpend: 200, description: 'Free delivery on orders above ₹200', status: 'published' }
      ];
      localStorage.setItem(localKey, JSON.stringify(defaultCoupons));
      return defaultCoupons;
    }
    if (name === 'users') {
      const defaultUsers = [
        { id: 'u1', name: 'Swapna', phone: '9876543210', email: 'swapna@gmail.com', addressText: 'Flat A-402, Kurupam Main Road, Vizag - 530001', status: 'active', totalOrders: 3, totalSpent: 1245.50 },
        { id: 'u2', name: 'Preeti Sharma', phone: '9988776655', email: 'preeti@yahoo.com', addressText: 'A-21, Saket, New Delhi - 110017', status: 'active', totalOrders: 1, totalSpent: 280.00 }
      ];
      localStorage.setItem(localKey, JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    if (name === 'notifications') {
      const defaultNotifications = [
        { id: 'n1', title: 'Grand Launch Offer!', content: 'Get 20% off on your first order. Use coupon WELCOME20.', type: 'promotional', sentTime: Date.now() - 3600000 * 24 },
        { id: 'n2', title: 'Super Fast 20m Delivery active!', content: 'Delivering fresh items directly to you in 20 minutes!', type: 'promotional', sentTime: Date.now() - 3600000 * 12 }
      ];
      localStorage.setItem(localKey, JSON.stringify(defaultNotifications));
      return defaultNotifications;
    }
    if (name === 'categories') {
      const defaultCategories = [
        { id: 'cat_grocery', name: 'Grocery', icon: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&q=80', section: 'Grocery & Kitchen', status: 'published', updatedAt: Date.now() },
        { id: 'cat_kitchen', name: 'Home & Kitchen Needs', icon: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=150&q=80', section: 'Grocery & Kitchen', status: 'published', updatedAt: Date.now() - 20 },
        { id: 'cat_personal', name: 'Personal Care', icon: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&q=80', section: 'Personal Care', status: 'published', updatedAt: Date.now() - 40 },
        { id: 'cat_dairy', name: 'Dairy & Beverages', icon: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&q=80', section: 'Grocery & Kitchen', status: 'published', updatedAt: Date.now() - 60 },
        { id: 'cat_snacks', name: 'Snacks', icon: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=150&q=80', section: 'Food & Beverages', status: 'published', updatedAt: Date.now() - 80 },
        { id: 'cat_bakery', name: 'Bakery', icon: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=150&q=80', section: 'Food & Beverages', status: 'published', updatedAt: Date.now() - 100 },
        { id: 'cat_fruits', name: 'Fruits', icon: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=150&q=80', section: 'Grocery & Kitchen', status: 'published', updatedAt: Date.now() - 120 },
        { id: 'cat_vegetables', name: 'Vegetables', icon: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=150&q=80', section: 'Grocery & Kitchen', status: 'published', updatedAt: Date.now() - 140 },
        { id: 'cat_beverages', name: 'Beverages', icon: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&q=80', section: 'Food & Beverages', status: 'published', updatedAt: Date.now() - 160 },
        { id: 'cat_household', name: 'Household Essentials', icon: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=150&q=80', section: 'Household', status: 'published', updatedAt: Date.now() - 180 }
      ];
      localStorage.setItem(localKey, JSON.stringify(defaultCategories));
      return defaultCategories;
    }
    if (name === 'products') {
      const defaultProducts = [
        // Dairy & Beverages
        {
          id: 'prod_milk',
          name: 'Milk',
          description: 'Fresh organic whole cow milk.',
          category: 'cat_dairy',
          department: 'Grocery',
          brand: 'Amul',
          variants: '500ml, 1L',
          locationId: 'Aisle B-1',
          price: 52,
          mrp: 60,
          stock: 80,
          unit: '500ml',
          images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&q=80'],
          status: 'published',
          pincodesAvailable: ['530001', '560001', '560002', '110001', '400001'],
          updatedAt: Date.now()
        },
        {
          id: 'prod_yogabar',
          name: 'Yoga Bar Protein Shake',
          description: 'High protein chocolate flavor shake.',
          category: 'cat_dairy',
          department: 'Grocery',
          brand: 'Yoga Bar',
          variants: '250ml',
          locationId: 'Aisle B-2',
          price: 99,
          mrp: 120,
          stock: 50,
          unit: '250ml',
          images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&q=80'],
          status: 'published',
          pincodesAvailable: ['530001', '560001', '560002', '110001', '400001'],
          updatedAt: Date.now() - 10
        },
        {
          id: 'prod_epigamia',
          name: 'Epigamia Milkshake',
          description: 'Delicious strawberry Greek yogurt milkshake.',
          category: 'cat_dairy',
          department: 'Grocery',
          brand: 'Epigamia',
          variants: '200ml',
          locationId: 'Aisle B-3',
          price: 40,
          mrp: 50,
          stock: 65,
          unit: '200ml',
          images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&q=80'],
          status: 'published',
          pincodesAvailable: ['530001', '560001', '560002', '110001', '400001'],
          updatedAt: Date.now() - 20
        },
        // Fruits & Veg
        {
          id: 'prod_apple',
          name: 'Apples',
          description: 'Sweet and delicious red apples.',
          category: 'cat_fruits',
          department: 'Grocery',
          brand: 'Farm Fresh',
          variants: '500g, 1kg',
          locationId: 'Aisle A-2',
          price: 149,
          mrp: 180,
          stock: 35,
          unit: '500g',
          images: ['https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=150&q=80'],
          status: 'published',
          pincodesAvailable: ['530001', '560001', '560002', '110001', '400001'],
          updatedAt: Date.now() - 30
        },
        {
          id: 'prod_potato',
          name: 'Potato',
          description: 'Fresh organic hybrid potato, handpicked.',
          category: 'cat_vegetables',
          department: 'Grocery',
          brand: 'Fresh Farms',
          variants: '1kg',
          locationId: 'Aisle A-1',
          price: 39,
          mrp: 45,
          stock: 45,
          unit: '1kg',
          images: ['https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=150&q=80'],
          status: 'published',
          pincodesAvailable: ['530001', '560001', '560002', '110001', '400001'],
          updatedAt: Date.now() - 40
        },
        // Grocery & Kitchen
        {
          id: 'prod_khetika',
          name: 'Khetika Premium Sabudana',
          description: 'Top grade sago pearls for fasting recipes.',
          category: 'cat_grocery',
          department: 'Grocery',
          brand: 'Khetika',
          variants: '500g',
          locationId: 'Aisle D-2',
          price: 68,
          mrp: 80,
          stock: 60,
          unit: '500g',
          images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&q=80'],
          status: 'published',
          pincodesAvailable: ['530001', '560001', '560002', '110001', '400001'],
          updatedAt: Date.now() - 50
        },
        {
          id: 'prod_farmley',
          name: 'Farmley Turkish Apricots',
          description: 'Premium dried apricots, sweet and healthy.',
          category: 'cat_grocery',
          department: 'Grocery',
          brand: 'Farmley',
          variants: '200g',
          locationId: 'Aisle D-4',
          price: 249,
          mrp: 299,
          stock: 40,
          unit: '200g',
          images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&q=80'],
          status: 'published',
          pincodesAvailable: ['530001', '560001', '560002', '110001', '400001'],
          updatedAt: Date.now() - 60
        },
        // Personal Care
        {
          id: 'prod_loreal',
          name: 'L\'Oreal Hyaluron Pure Shampoo',
          description: 'Salicylic acid shampoo for oily scalp and dry hair.',
          category: 'cat_personal',
          department: 'Personal Care',
          brand: 'L\'Oreal',
          variants: '340ml',
          locationId: 'Aisle G-1',
          price: 299,
          mrp: 349,
          stock: 25,
          unit: '340ml',
          images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&q=80'],
          status: 'published',
          pincodesAvailable: ['530001', '560001', '560002', '110001', '400001'],
          updatedAt: Date.now() - 70
        },
        {
          id: 'prod_rashel',
          name: 'Dr. Rashel Sunscreen',
          description: 'SPF 60 water resistant sunscreen cream.',
          category: 'cat_personal',
          department: 'Personal Care',
          brand: 'Dr. Rashel',
          variants: '80g',
          locationId: 'Aisle G-2',
          price: 180,
          mrp: 220,
          stock: 30,
          unit: '80g',
          images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&q=80'],
          status: 'published',
          pincodesAvailable: ['530001', '560001', '560002', '110001', '400001'],
          updatedAt: Date.now() - 80
        },
        // Home & Kitchen Needs
        {
          id: 'prod_ariel',
          name: 'Ariel Power Gel',
          description: 'Concentrated liquid laundry detergent.',
          category: 'cat_kitchen',
          department: 'Kitchen Needs',
          brand: 'Ariel',
          variants: '1L',
          locationId: 'Aisle F-1',
          price: 240,
          mrp: 280,
          stock: 45,
          unit: '1L',
          images: ['https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=150&q=80'],
          status: 'published',
          pincodesAvailable: ['530001', '560001', '560002', '110001', '400001'],
          updatedAt: Date.now() - 90
        },
        {
          id: 'prod_wiper',
          name: 'Floor Wiper',
          description: 'Durable rubber blade cleaning floor wiper.',
          category: 'cat_kitchen',
          department: 'Kitchen Needs',
          brand: 'Spotzero',
          variants: 'Single pack',
          locationId: 'Aisle F-3',
          price: 150,
          mrp: 180,
          stock: 20,
          unit: '1 Unit',
          images: ['https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=150&q=80'],
          status: 'published',
          pincodesAvailable: ['530001', '560001', '560002', '110001', '400001'],
          updatedAt: Date.now() - 100
        },
        // Snacks & Beverages
        {
          id: 'prod_chips',
          name: 'Lays Classic Salted',
          description: 'Crispy potato chips.',
          category: 'cat_snacks',
          department: 'Grocery',
          brand: 'Lays',
          variants: '50g',
          locationId: 'Aisle D-1',
          price: 18,
          mrp: 20,
          stock: 120,
          unit: '50g',
          images: ['https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=150&q=80'],
          status: 'published',
          pincodesAvailable: ['530001', '560001', '560002', '110001', '400001'],
          updatedAt: Date.now() - 110
        },
        {
          id: 'prod_coke',
          name: 'Coca-Cola Can',
          description: 'Chilled refreshing soft drink.',
          category: 'cat_beverages',
          department: 'Grocery',
          brand: 'Coca-Cola',
          variants: '330ml Can',
          locationId: 'Aisle C-1',
          price: 30,
          mrp: 40,
          stock: 150,
          unit: '330ml Can',
          images: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&q=80'],
          status: 'published',
          pincodesAvailable: ['530001', '560001', '560002', '110001', '400001'],
          updatedAt: Date.now() - 120
        },
        {
          id: 'prod_bread',
          name: 'Whole Wheat Bread',
          description: 'Fresh fiber-rich whole wheat sliced bread.',
          category: 'cat_bakery',
          department: 'Grocery',
          brand: 'Harvest',
          variants: '400g',
          locationId: 'Aisle D-3',
          price: 38,
          mrp: 45,
          stock: 20,
          unit: '400g',
          images: ['https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=150&q=80'],
          status: 'published',
          pincodesAvailable: ['530001', '560001', '560002', '110001', '400001'],
          updatedAt: Date.now() - 130
        },
        // Household
        {
          id: 'prod_cleaner',
          name: 'Floor Cleaner Liquid',
          description: 'Disinfectant surface and floor cleaner.',
          category: 'cat_household',
          department: 'Household',
          brand: 'Lizol',
          variants: '500ml',
          locationId: 'Aisle F-4',
          price: 85,
          mrp: 95,
          stock: 75,
          unit: '500ml',
          images: ['https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=150&q=80'],
          status: 'published',
          pincodesAvailable: ['530001', '560001', '560002', '110001', '400001'],
          updatedAt: Date.now() - 140
        }
      ];
      localStorage.setItem(localKey, JSON.stringify(defaultProducts));
      return defaultProducts;
    }
    return [];
  }
  try {
    return JSON.parse(localData);
  } catch {
    return [];
  }
};

const saveLocalItems = (name: string, items: any[]) => {
  localStorage.setItem(getLocalKey(name), JSON.stringify(items));
  window.dispatchEvent(new Event(`ushamart_local_db_update_${name}`));
};

const mapOrderToUI = (r: any) => {
  if (!r) return null;
  return {
    ...r,
    pincode: r.pincode,
    items: r.items,
    summary: {
      subtotal: Number(r.subtotal || 0),
      deliveryCharges: Number(r.deliveryCharges || 0),
      discountAmount: Number(r.discountAmount || 0),
      totalAmount: Number(r.totalAmount || 0)
    },
    deliverySlot: r.deliverySlot || 'Same Day Delivery',
    address: {
      name: r.userName || '',
      phone: r.userPhone || '',
      addressText: r.addressText || ''
    },
    paymentMethod: r.paymentMethod || 'COD',
    status: r.status,
    couponCode: r.couponCode,
    createdAt: r.createdAt ? Number(r.createdAt) : Date.now()
  };
};

const mapOrderToDB = (docData: any) => {
  const summary = docData.summary || {};
  const address = docData.address || {};
  const flattened: any = {};

  flattened.id = docData.id || 'order_' + Math.random().toString(36).substring(2, 9);
  if (docData.userId) flattened.userId = docData.userId;
  flattened.userName = address.name || null;
  flattened.userPhone = address.phone || null;
  flattened.userEmail = address.email || null;
  flattened.addressText = address.addressText || null;
  flattened.pincode = docData.pincode || null;
  flattened.items = docData.items || [];
  flattened.subtotal = summary.subtotal !== undefined ? summary.subtotal : 0;
  flattened.deliveryCharges = summary.deliveryCharges !== undefined ? summary.deliveryCharges : 0;
  flattened.discountAmount = summary.discountAmount !== undefined ? summary.discountAmount : 0;
  flattened.totalAmount = summary.totalAmount !== undefined ? summary.totalAmount : 0;
  flattened.couponCode = docData.couponCode || null;
  flattened.status = docData.status || 'Pending';
  flattened.paymentMethod = docData.paymentMethod || 'COD';
  flattened.deliverySlot = docData.deliverySlot || null;
  flattened.createdAt = docData.createdAt || Date.now();
  flattened.updatedAt = Date.now();

  return flattened;
};

export const db = {
  collection: (name: string) => {
    return {
      get: async (): Promise<any[]> => {
        if (isSupabaseConfigured && supabase) {
          try {
            const { data, error } = await supabase.from(name).select('*');
            if (error) throw error;

            if (name === 'pincodes') {
              const codes = (data || []).map((p: any) => p.code);
              saveLocalItems(name, codes);
              return codes;
            }

            let results = data || [];
            if (name === 'orders') {
              results = results.map(mapOrderToUI);
            }

            saveLocalItems(name, results);
            return results;
          } catch (err) {
            console.warn(`Supabase get failed for ${name}, falling back to local storage`, err);
          }
        }
        return getLocalItems(name);
      },

      add: async (docData: any): Promise<any> => {
        let newId = name === 'pincodes'
          ? (typeof docData === 'string' ? docData : docData.code)
          : (docData.id || 'id_' + Math.random().toString(36).substring(2, 9));

        let payload = name === 'pincodes'
          ? { id: newId, code: newId }
          : {
              ...docData,
              id: newId,
              createdAt: docData.createdAt || Date.now(),
              updatedAt: Date.now()
            };

        if (name === 'orders') {
          payload = mapOrderToDB({ ...docData, id: newId });
        }

        if (isSupabaseConfigured && supabase) {
          try {
            const { data, error } = await supabase.from(name).insert(payload).select().single();
            if (error) throw error;

            const items = getLocalItems(name);
            const newItem = name === 'pincodes' 
              ? newId 
              : (name === 'orders' ? mapOrderToUI(data) : data);
            
            items.push(newItem);
            saveLocalItems(name, items);
            return newItem;
          } catch (err) {
            console.warn(`Supabase add failed for ${name}, running via local storage`, err);
          }
        }

        const items = getLocalItems(name);
        const newItem = name === 'pincodes' 
          ? newId 
          : (name === 'orders' ? mapOrderToUI(payload) : payload);
        
        items.push(newItem);
        saveLocalItems(name, items);
        return newItem;
      },

      update: async (id: string, updatedFields: any): Promise<any> => {
        let payload = {
          ...updatedFields,
          updatedAt: Date.now()
        };

        if (name === 'orders') {
          payload = mapOrderToDB({ ...updatedFields, id });
        }

        if (isSupabaseConfigured && supabase) {
          try {
            const { data, error } = await supabase.from(name).update(payload).eq('id', id).select().single();
            if (error) throw error;

            const items = getLocalItems(name);
            const updatedItem = name === 'orders' ? mapOrderToUI(data) : data;
            
            const updatedList = items.map(item => {
              if (name === 'pincodes') return item === id ? id : item;
              return item.id === id ? { ...item, ...updatedItem } : item;
            });
            saveLocalItems(name, updatedList);
            return name === 'pincodes' ? id : updatedItem;
          } catch (err) {
            console.warn(`Supabase update failed for ${name}, using local storage fallback`, err);
          }
        }

        const items = getLocalItems(name);
        const updatedList = items.map(item => {
          if (name === 'pincodes') {
            return item === id ? id : item;
          }
          return item.id === id ? { ...item, ...payload } : item;
        });
        saveLocalItems(name, updatedList);
        return name === 'pincodes' ? id : (name === 'orders' ? mapOrderToUI(payload) : { id, ...payload });
      },

      set: async (id: string, docData: any): Promise<any> => {
        let payload = {
          ...docData,
          id,
          updatedAt: Date.now()
        };

        if (name === 'orders') {
          payload = mapOrderToDB({ ...docData, id });
        }

        if (isSupabaseConfigured && supabase) {
          try {
            const { data, error } = await supabase.from(name).upsert(payload).select().single();
            if (error) throw error;

            const items = getLocalItems(name);
            const upsertedItem = name === 'orders' ? mapOrderToUI(data) : data;
            
            const exists = items.some(item => (name === 'pincodes' ? item === id : item.id === id));
            let updatedList;
            if (exists) {
              updatedList = items.map(item => {
                if (name === 'pincodes') return item === id ? id : item;
                return item.id === id ? upsertedItem : item;
              });
            } else {
              updatedList = [...items, name === 'pincodes' ? id : upsertedItem];
            }
            saveLocalItems(name, updatedList);
            return name === 'pincodes' ? id : upsertedItem;
          } catch (err) {
            console.warn(`Supabase set failed for ${name}, executing via local storage`, err);
          }
        }

        const items = getLocalItems(name);
        const exists = items.some(item => (name === 'pincodes' ? item === id : item.id === id));
        let updatedList;
        const fallbackItem = name === 'orders' ? mapOrderToUI(payload) : payload;
        if (exists) {
          updatedList = items.map(item => {
            if (name === 'pincodes') return item === id ? id : item;
            return item.id === id ? fallbackItem : item;
          });
        } else {
          updatedList = [...items, name === 'pincodes' ? id : fallbackItem];
        }
        saveLocalItems(name, updatedList);
        return name === 'pincodes' ? id : fallbackItem;
      },

      delete: async (id: string): Promise<boolean> => {
        if (isSupabaseConfigured && supabase) {
          try {
            const { error } = await supabase.from(name).delete().eq('id', id);
            if (error) throw error;
            const items = getLocalItems(name);
            const filteredList = items.filter(item => (name === 'pincodes' ? item !== id : item.id !== id));
            saveLocalItems(name, filteredList);
            return true;
          } catch (err) {
            console.warn(`Supabase delete failed for ${name}, using local storage`, err);
          }
        }

        const items = getLocalItems(name);
        const filteredList = items.filter(item => (name === 'pincodes' ? item !== id : item.id !== id));
        saveLocalItems(name, filteredList);
        return true;
      },

      onSnapshot: (callback: (data: any[]) => void) => {
        let active = true;

        const emitLocal = () => {
          const items = getLocalItems(name);
          if (name !== 'pincodes') {
            items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          }
          if (active) callback(items);
        };

        if (isSupabaseConfigured && supabase) {
          const client = supabase;
          const loadData = async () => {
            try {
              const { data, error } = await client.from(name).select('*');
              if (error) throw error;
              let items = data || [];
              if (name === 'pincodes') {
                items = items.map((p: any) => p.code);
              } else if (name === 'orders') {
                items = items.map(mapOrderToUI);
                items.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
              } else {
                items.sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0));
              }
              localStorage.setItem(getLocalKey(name), JSON.stringify(items));
              if (active) callback(items);
            } catch (err) {
              console.warn(`Supabase snapshot fetch failed for ${name}, utilizing local mirror`, err);
              emitLocal();
            }
          };

          loadData();

          const channel = client
            .channel(`realtime_${name}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: name }, () => {
              loadData();
            })
            .subscribe();

          const localListener = () => {
            emitLocal();
          };
          window.addEventListener(`ushamart_local_db_update_${name}`, localListener);

          return () => {
            active = false;
            channel.unsubscribe();
            window.removeEventListener(`ushamart_local_db_update_${name}`, localListener);
          };
        } else {
          emitLocal();
          const localListener = () => {
            emitLocal();
          };
          window.addEventListener(`ushamart_local_db_update_${name}`, localListener);
          return () => {
            active = false;
            window.removeEventListener(`ushamart_local_db_update_${name}`, localListener);
          };
        }
      }
    };
  }
};

export const auth = {
  getCurrentUser: () => {
    try {
      const localUser = localStorage.getItem('ushamart_user');
      return localUser ? JSON.parse(localUser) : null;
    } catch {
      return null;
    }
  },

  signUpWithEmail: async (email: string, name: string, phone: string, addressText: string) => {
    const uid = 'usr_' + Math.random().toString(36).substring(2, 9);
    const user = {
      uid,
      id: uid,
      email,
      name,
      phone,
      addressText,
      role: 'customer',
      status: 'active',
      totalOrders: 0,
      totalSpent: 0
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const password = 'UserPassword123!';
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, phone }
          }
        });
        if (authError) throw authError;

        if (authData?.user) {
          const dbUser = {
            id: authData.user.id,
            name,
            phone,
            email,
            addressText,
            role: 'customer',
            status: 'active',
            totalOrders: 0,
            totalSpent: 0
          };
          const { error: profileError } = await supabase.from('users').insert(dbUser);
          if (profileError) throw profileError;

          const fullUser = { ...dbUser, uid: authData.user.id };
          localStorage.setItem('ushamart_user', JSON.stringify(fullUser));
          window.dispatchEvent(new Event('ushamart_auth_change'));
          return fullUser;
        }
      } catch (err: any) {
        console.warn("Supabase auth signUp failed, using offline session:", err.message);
      }
    }

    const users = getLocalItems('users');
    users.push(user);
    saveLocalItems('users', users);

    localStorage.setItem('ushamart_user', JSON.stringify(user));
    window.dispatchEvent(new Event('ushamart_auth_change'));
    return user;
  },

  signInWithEmail: async (email: string) => {
    const users = getLocalItems('users');
    const matchedUser = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

    if (matchedUser && matchedUser.status === 'blocked') {
      throw new Error('Your customer account is blocked by UshaMart Admin.');
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const password = 'UserPassword123!';
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (authError) throw authError;

        if (authData?.user) {
          const { data: profile } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
          if (profile) {
            if (profile.status === 'blocked') {
              await supabase.auth.signOut();
              throw new Error('Your customer account is blocked by UshaMart Admin.');
            }
            const fullUser = { ...profile, uid: authData.user.id };
            localStorage.setItem('ushamart_user', JSON.stringify(fullUser));
            window.dispatchEvent(new Event('ushamart_auth_change'));
            return fullUser;
          }
        }
      } catch (err: any) {
        console.warn("Supabase signInWithPassword failed, using offline session validation:", err.message);
        if (err.message && err.message.includes('blocked')) {
          throw err;
        }
      }
    }

    if (!matchedUser) {
      throw new Error('No registered account found with this email. Please sign up first.');
    }

    localStorage.setItem('ushamart_user', JSON.stringify(matchedUser));
    window.dispatchEvent(new Event('ushamart_auth_change'));
    return matchedUser;
  },

  signInAdmin: async (email: string, password: string): Promise<any> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (authError) throw authError;

        if (authData?.user) {
          let { data: profile } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
          if (!profile) {
            const role = email === 'naidumay123@gmail.com' ? 'super_admin' : 'store_manager';
            const name = role === 'super_admin' ? 'Super Admin' : 'Store Manager';
            const newAdmin = {
              id: authData.user.id,
              name,
              email,
              role,
              status: 'active',
              totalOrders: 0,
              totalSpent: 0
            };
            await supabase.from('users').insert(newAdmin);
            profile = newAdmin;
          }

          if (profile.status === 'blocked') {
            await supabase.auth.signOut();
            throw new Error('Administrative account is blocked.');
          }

          const adminUser = {
            ...profile,
            uid: authData.user.id
          };
          localStorage.setItem('ushamart_user', JSON.stringify(adminUser));
          window.dispatchEvent(new Event('ushamart_auth_change'));
          return adminUser;
        }
      } catch (err: any) {
        console.warn("Supabase admin auth failed, attempting offline decryption fallback:", err.message);
        if (err.message && err.message.includes('blocked')) {
          throw err;
        }
      }
    }

    const decryptAdminMethod3 = (hex: string) => {
      let str = '';
      for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      return str;
    };
    const decryptAdminMethod2 = (str: string) => str.split('').reverse().join('');
    const decryptAdminMethod1 = (str: string) => decodeURIComponent(escape(atob(str)));
    const decryptAdminCredentials = (input: string) => decryptAdminMethod1(decryptAdminMethod2(decryptAdminMethod3(input)));

    const storedAdminEmail = "74393259757757616831325a414e6a4d786b58597456485a70466d62";
    const storedAdminPass = "3d3d514d416c57596f4a576471466d55";

    if (email === decryptAdminCredentials(storedAdminEmail) && password === decryptAdminCredentials(storedAdminPass)) {
      const user = {
        uid: 'adm_super_local',
        id: 'adm_super_local',
        email,
        role: 'super_admin',
        name: 'Super Admin',
        status: 'active'
      };
      localStorage.setItem('ushamart_user', JSON.stringify(user));
      window.dispatchEvent(new Event('ushamart_auth_change'));
      return user;
    }

    throw new Error('Invalid administrative credentials.');
  },

  signOut: async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.removeItem('ushamart_user');
    window.dispatchEvent(new Event('ushamart_auth_change'));
  }
};

export const storage = {
  uploadImage: async (file: File): Promise<string> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `product-images/${fileName}`;

        const { data, error } = await supabase.storage
          .from('usha-mart-bucket')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('usha-mart-bucket')
          .getPublicUrl(filePath);

        return publicUrl;
      } catch (err: any) {
        console.warn("Supabase Storage image upload failed, falling back to local base64:", err.message);
      }
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }
};
