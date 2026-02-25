import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../context/api';

export default function Queue() {
  const { shopId } = useParams();
  const [queue, setQueue] = useState([]);

  const load = () => api.get(`/queue/shop/${shopId}`).then(res => setQueue(res.data.queue));

  useEffect(() => { load(); }, [shopId]);

  const join = async () => {
    await api.post(`/queue/${shopId}/join`, { service: { name: 'Haircut', price: 300 } });
    load();
  };

  return (
    <>
      <h2>Queue</h2>
      <button onClick={join}>Join Queue</button>
      <ul>
        {queue.map(q => (
          <li key={q._id}>{q.customer.fullName} — {q.status}</li>
        ))}
      </ul>
    </>
  );
}
