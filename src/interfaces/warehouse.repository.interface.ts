export interface IWarehouseRepository {
  findWarehousesWithStock(items: {
    productId: string;
    quantity: number;
  }[]): Promise<
    {
      id: string;
      name: string;
      latitude: number;
      longitude: number;
    }[]
  >;
}