import { NextRequest, NextResponse } from "next/server";
import { getServerSellerAccess } from "@/lib/auth/server";
import { getGameAccountById, updateGameAccount, deleteGameAccount } from "@/lib/db/collections/game-accounts";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await getServerSellerAccess(req);
    if (authResult.status !== 200) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { sellerId } = authResult.access!;
    const { id } = await params;

    const account = await getGameAccountById(id);

    if (!account) {
      return NextResponse.json({ error: "Game account not found" }, { status: 404 });
    }

    if (account.seller_id !== sellerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      account: {
        id: account.id,
        gameName: account.game_name,
        gameNameTh: account.game_name_th ?? "",
        accountUsername: account.account_username,
        accountPassword: account.account_password,
        description: account.description ?? "",
        price: Number(account.price),
        stock: account.stock,
        isActive: account.is_active,
        platform: account.platform ?? "",
        region: account.region ?? "",
        imageUrl: account.image_url ?? "",
        createdAt: account.created_at,
        updatedAt: account.updated_at,
      },
    });
  } catch (error) {
    console.error("Seller game-account GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await getServerSellerAccess(req);
    if (authResult.status !== 200) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { sellerId } = authResult.access!;
    const { id } = await params;

    const existing = await getGameAccountById(id);

    if (!existing) {
      return NextResponse.json({ error: "Game account not found" }, { status: 404 });
    }

    if (existing.seller_id !== sellerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const {
      gameName,
      gameNameTh,
      accountUsername,
      accountPassword,
      description,
      price,
      stock,
      isActive,
      platform,
      region,
      imageUrl,
    } = body;

    const updates: Record<string, unknown> = {};

    if (gameName !== undefined) {
      if (typeof gameName !== "string" || gameName.trim() === "") {
        return NextResponse.json({ error: "Game name cannot be empty" }, { status: 400 });
      }
      updates.game_name = gameName.trim();
    }
    if (gameNameTh !== undefined) updates.game_name_th = gameNameTh?.trim() ?? null;
    if (accountUsername !== undefined) {
      if (typeof accountUsername !== "string" || accountUsername.trim() === "") {
        return NextResponse.json({ error: "Account username cannot be empty" }, { status: 400 });
      }
      updates.account_username = accountUsername.trim();
    }
    if (accountPassword !== undefined) {
      if (typeof accountPassword !== "string" || accountPassword === "") {
        return NextResponse.json({ error: "Account password cannot be empty" }, { status: 400 });
      }
      updates.account_password = accountPassword;
    }
    if (description !== undefined) updates.description = description?.trim() ?? null;
    if (price !== undefined) {
      if (typeof price !== "number" || price < 0) {
        return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 });
      }
      updates.price = price;
    }
    if (stock !== undefined) {
      if (typeof stock !== "number" || stock < 0 || !Number.isInteger(stock)) {
        return NextResponse.json({ error: "Stock must be a non-negative integer" }, { status: 400 });
      }
      updates.stock = stock;
    }
    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
      }
      updates.is_active = isActive;
    }
    if (platform !== undefined) updates.platform = platform?.trim() ?? null;
    if (region !== undefined) updates.region = region?.trim() ?? null;
    if (imageUrl !== undefined) updates.image_url = imageUrl?.trim() ?? null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await updateGameAccount(id, updates);

    if (!updated) {
      return NextResponse.json({ error: "Failed to update game account" }, { status: 500 });
    }

    return NextResponse.json({
      account: {
        id: updated.id,
        gameName: updated.game_name,
        gameNameTh: updated.game_name_th ?? "",
        accountUsername: updated.account_username,
        description: updated.description ?? "",
        price: Number(updated.price),
        stock: updated.stock,
        isActive: updated.is_active,
        platform: updated.platform ?? "",
        region: updated.region ?? "",
        imageUrl: updated.image_url ?? "",
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    });
  } catch (error) {
    console.error("Seller game-account PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await getServerSellerAccess(req);
    if (authResult.status !== 200) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { sellerId } = authResult.access!;
    const { id } = await params;

    const account = await getGameAccountById(id);

    if (!account) {
      return NextResponse.json({ error: "Game account not found" }, { status: 404 });
    }

    if (account.seller_id !== sellerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const success = await deleteGameAccount(id);

    if (!success) {
      return NextResponse.json({ error: "Failed to delete game account" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Seller game-account DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
