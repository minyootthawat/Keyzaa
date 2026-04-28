// Re-export from Supabase
export type { DbOrder, OrderItem } from "@/lib/db/supabase";
// Re-export status types from app/types
export type { OrderStatus, PaymentStatus, FulfillmentStatus } from "@/app/types";

export {
  getOrderById,
  getOrderByPublicId,
  getOrdersByBuyer,
  getOrdersBySeller,
  createOrder,
  updateOrder,
  updateOrderStatus,
  updateOrderFields,
  listOrders,
} from "@/lib/db/supabase";
