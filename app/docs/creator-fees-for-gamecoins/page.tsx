import Image from 'next/image'

export default function CreatorFeesForGamecoinsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-8">Creator Fees for Gamecoins</h1>
        
        <div className="space-y-6">
          <p className="text-lg">
            Whenever you launch a token along with your game built, you can generate creator fees once your token is bonded from bonding curve (169 SOL Market Cap).
          </p>

          <p className="text-lg">
            Any game creator fees keep earning 0.32% of the lifetime trading volume. For instance, if your token hits $10 million in total volume, a 0.32% creator fee earns you $32,000 in SOL as game creator fees.
          </p>

          <p className="text-lg">
            You can claim your fees real-time from: <a href="/profile" className="text-blue-500 hover:text-blue-600 underline">vibegame.fun/profile</a> → go to your game → claim any pending fees.
          </p>

          <div className="my-8">
            <Image
              src="/fees.png"
              alt="Creator Fees Screenshot"
              width={800}
              height={600}
              className="rounded-lg shadow-lg"
            />
          </div>

          <h2 className="text-2xl font-bold mt-12 mb-6">Why Creator Fees?</h2>

          <p className="text-lg">
            Creator fees are meant to ensure sustainable development of games launched via vibegame and give rise to monetisation models which are novel to crypto.
          </p>

          <p className="text-lg">
            Here&apos;s a flywheel to showcase:
          </p>

          <div className="my-8">
            <Image
              src="/flywheel.jpg"
              alt="Creator Fees Flywheel"
              width={800}
              height={600}
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  )
} 