import Head from 'next/head'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../lib/auth';
import Login from "./login"
import Loading from "../components/Loading"

export default function Home() {
  // Can use our own useAuth
  // const { user, loading } = useAuth();

  return (
    <div>
      <Head>
        <title>Whatsapp 2.0</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
  
      <Sidebar />

    </div>
  )
}
