import { NextRequest, NextResponse } from "next/server";
import { getServerSellerAccess } from "@/lib/auth/server";
import { getGameAccountsBySeller, createGameAccount } from "@/lib/db/collections/game-accounts";

export async function GET(req: NextRequest) {
  try {
    const authResult = await getServerSellerAccess(req);
    if (authResult.status !== 200) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { sellerId } = authResult.access!;

    const accounts = await getGameAccountsBySeller(sellerId);

    const mapped = accounts.map((a) => ({
      id: a.id,
      gameName: a.game_name,
      gameNameTh: a.game_name_th ?? "",
      accountUsername: a.account_username,
      // accountPassword intentionally excluded from list response
      description: a.description ?? "",
      price: Number(a.price),
      stock: a.stock,
      isActive: a.is_active,
      platform: a.platform ?? "",
      region: a.region ?? "",
      imageUrl: a.image_url ?? "",
      createdAt: a.created_at,
    }));

    return NextResponse.json({ accounts: mapped, total: mapped.length });
  } catch (error) {
    console.error("Seller game-accounts list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await getServerSellerAccess(req);
    if (authResult.status !== 200) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { sellerId } = authResult.access!;

    const body = await req.json();

    const {
      gameName,
      gameNameTh,
      accountUsername,
      accountPassword,
      description,
      price,
      stock,
      platform,
      region,
      imageUrl,
    } = body;

    if (!gameName || typeof gameName !== "string" || gameName.trim() === "") {
      return NextResponse.json({ error: "Game name is required" }, { status: 400 });
    }
    if (!accountUsername || typeof accountUsername !== "string" || accountUsername.trim() === "") {
      return NextResponse.json({ error: "Account username is required" }, { status: 400 });
    }
    if (!accountPassword || typeof accountPassword !== "string" || accountPassword === "") {
      return NextResponse.json({ error: "Account password is required" }, { status: 400 });
    }
    if (price !== undefined && (typeof price !== "number" || price < 0)) {
      return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 });
    }
    if (stock !== undefined && (typeof stock !== "number" || stock < 0)) {
      return NextResponse.json({ error: "Stock must be a non-negative integer" }, { status: 400 });
    }

    const account = await createGameAccount({
      sellerId,
      gameName: gameName.trim(),
      gameNameTh: gameNameTh?.trim(),
      accountUsername: accountUsername.trim(),
      accountPassword,
      description: description?.trim(),
      price: price ?? 0,
      stock: stock ?? 1,
      platform: platform?.trim(),
      region: region?.trim(),
      imageUrl: imageUrl?.trim(),
    });

    if (!account) {
      return NextResponse.json({ error: "Failed to create game account" }, { status: 500 });
    }

    return NextResponse.json(
      {
        account: {
          id: account.id,
          gameName: account.game_name,
          gameNameTh: account.game_name_th ?? "",
          accountUsername: account.account_username,
          description: account.description ?? "",
          price: Number(account.price),
          stock: account.stock,
          isActive: account.is_active,
          platform: account.platform ?? "",
          region: account.region ?? "",
          imageUrl: account.image_url ?? "",
          createdAt: account.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Seller game-account create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
