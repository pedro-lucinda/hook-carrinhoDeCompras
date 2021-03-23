import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(() => {
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
  }, [cart]);

  const addProduct = async (productId: number) => {
    let productsList: Product[] = [];

    try {
      await api.get("/products").then((response) => {
        productsList = response.data;
      });
    } catch {
      console.log(Error);
    }
    //get the product
    const productToAddToCart = productsList.filter(
      (product) => product.id === productId
    );

    //check if it is already on the cart
    const isOnCart = cart.filter((product) =>
      product.id === productToAddToCart[0].id 
    );

    if (isOnCart.length > 0) {
      return updateProductAmount({ productId: productId, amount: 1 });
    } else {
      const product = productToAddToCart[0];
      product.amount = 1;
      return setCart([...cart, product]);
    }
  };

  const removeProduct = (productId: number) => {
    const newCartList = cart.filter((product) => product.id !== productId);
    setCart(newCartList);
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    let stock: Stock[] = [];
    try {
      await api.get("/stock").then((response) => {
        stock = response.data;
      });
    } catch {
      console.log(Error);
    }
    //change amount
    const updatedCart = cart.map((product) => {
      const productStock = stock.filter(
        (prodInStock) => prodInStock.id === product.id
      );
      console.log("productStock", productStock);
      if (product.id === productId) {
        if (amount === 1) {
          if (productStock[0].amount > product.amount) {
            product.amount += 1;
          } else {
            toast.error("Quantidade solicitada fora de estoque");
          }
        }
        if (amount === -1) {
          product.amount -= 1;
        }
      }
      return product;
    });
    setCart(updatedCart);
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
