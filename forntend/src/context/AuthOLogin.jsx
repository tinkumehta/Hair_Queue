import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'


function auth0() {
  const [count, setCount] = useState(0)
  const {loginWithRedirect , user, isAuthenticated, logout} = useAuth0();

  console.log("Current user ", user);
  
  return (
    <div className="app">
     
    {isAuthenticated && 
    <div>
    <h2>{user.name}</h2>
    <img src={user.picture} alt="" />
    </div>
    }
      <header className='App-header'>
        {isAuthenticated ? (
          <button onClick={(e) => logout()}>Log out</button>
        ) : (
          <button onClick={(e) => loginWithRedirect()}>
          Login With Redireact
        </button>
        )}
        
      </header>
    </div>
  )
}

export default auth0
