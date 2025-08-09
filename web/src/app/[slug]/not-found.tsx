import Link from 'next/link'

export default function StoreNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Loja não encontrada</h2>
        <p className="text-gray-600 mb-8">
          A loja que você está procurando não existe ou foi removida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}