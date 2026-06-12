import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { setContext } from '@apollo/client/link/context';
import { RetryLink } from '@apollo/client/link/retry';

const GRAPHQL_URI = import.meta.env.VITE_GRAPHQL_URI || 'http://localhost:5000/graphql';

const httpLink = createHttpLink({
  uri: GRAPHQL_URI,
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

// Retry up to 5 times with exponential backoff — handles Render cold-start (~30s spin-up)
const retryLink = new RetryLink({
  delay: {
    initial: 2000,   // wait 2s before first retry
    max: 15000,      // max 15s between retries
    jitter: true,
  },
  attempts: {
    max: 5,
    retryIf: (error) => !!error, // retry on any network error
  },
});

const client = new ApolloClient({
  link: ApolloLink.from([retryLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </StrictMode>,
);
