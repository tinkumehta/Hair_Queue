import { useEffect, useState } from 'react';
import api from '../context/api';
import { Link } from 'react-router-dom';

export default function Home() {
  const [shops, setShops] = useState([]);

  useEffect(() => {
    api.get('/shops').then(res => setShops(res.data.shops));
  }, []);

  return (
    <>
      <h2>Shops</h2>
      {shops.map(s => (
        <div key={s._id}>
          <Link to={`/queue/${s._id}`}>{s.name}</Link>
        </div>
      ))}
    </>
  );
}
