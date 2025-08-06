import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, rewardName } = await request.json()

    if (!walletAddress || !rewardName) {
      return NextResponse.json({ error: 'Wallet address and reward name are required' }, { status: 400 })
    }

    // Find or create user
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {},
      create: { walletAddress }
    })

    // Parse reward to determine type and value
    const getRewardDetails = (reward: string) => {
      if (reward.includes('NFT')) {
        return { type: 'NFT', value: null }
      } else if (reward.includes('Polygon')) {
        const match = reward.match(/(\d+)\s+Polygon/)
        return { type: 'Polygon', value: match ? parseInt(match[1]) : null }
      } else if (reward.includes('Gianky')) {
        const match = reward.match(/(\d+)\s+Gianky/)
        return { type: 'Gianky', value: match ? parseInt(match[1]) : null }
      }
      return { type: 'Other', value: null }
    }

    const { type, value } = getRewardDetails(rewardName)

    // Create game record and reward record in a transaction
    const result = await prisma.$transaction([
      // Create game record
      prisma.game.create({
        data: {
          userId: user.id,
          rewardWon: rewardName
        }
      }),
      // Create reward record
      prisma.reward.create({
        data: {
          userId: user.id,
          rewardName,
          rewardType: type,
          rewardValue: value
        }
      })
    ])

    return NextResponse.json({ 
      game: result[0], 
      reward: result[1],
      message: 'Game played and reward saved successfully' 
    })
  } catch (error) {
    console.error('Error saving game and reward:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 