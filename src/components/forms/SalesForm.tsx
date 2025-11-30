"use client";

import { useEffect, useState } from "react";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ChevronLeft } from "lucide-react";
import { StockItem } from "@/store/stockStore";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

// Schema matches API body
const formSchema = z.object({
    productId: z.string().min(1, { message: "Product ID is required." }),
    quantity: z.coerce
        .number()
        .int()
        .positive({ message: "Quantity must be a positive number." }),
    paidAmount: z.coerce
        .number()
        .nonnegative({ message: "Paid amount must be 0 or more." }),
    customerName: z
        .string()
        .min(2, { message: "Customer name must be at least 2 characters." }),
});

export type SalesFormValues = z.infer<typeof formSchema>;

type SalesFormProps = {
    products: StockItem[];
    onBack: () => void;
    onSubmit: (data: SalesFormValues) => void;
    editItem?: SalesFormValues | null;
};

export function SalesForm({
    products,
    onBack,
    onSubmit,
    editItem = null,
}: SalesFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!editItem;

    const form = useForm<SalesFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            productId: "",
            quantity: undefined,
            paidAmount: undefined,
            customerName: "",
        },
    });

    // Pre-fill form when in edit mode
    useEffect(() => {
        if (editItem) {
            form.reset(editItem);
        }
    }, [editItem, form]);

    async function handleSubmit(values: SalesFormValues) {
        setIsSubmitting(true);
        const apiBody = {
            productId: values.productId,
            quantity: values.quantity,
            paidAmount: values.paidAmount,
            customerName: values.customerName,
        };
        await onSubmit(apiBody);
        setIsSubmitting(false);
        form.reset();
        onBack();
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
            >
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onBack}
                    className="mb-2 p-0 h-auto bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive rounded-md"
                    aria-label="Back"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>

                <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Product</FormLabel>
                            <FormControl>
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products
                                            .filter(
                                                (product) =>
                                                    product.quantity > 0
                                            )
                                            .map((product) => (
                                                <SelectItem
                                                    key={product._id}
                                                    value={product._id!}
                                                >
                                                    {product.name} (Stock:{" "}
                                                    {product.quantity})
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="Enter quantity"
                                    {...field}
                                    onChange={(e) => {
                                        const value = Number.parseInt(
                                            e.target.value
                                        );
                                        if (!isNaN(value) && value >= 0) {
                                            field.onChange(value);
                                        } else if (e.target.value === "") {
                                            field.onChange(e.target.value);
                                        }
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="paidAmount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Paid Amount</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter paid amount"
                                    {...field}
                                    onChange={(e) => {
                                        const value = Number.parseFloat(
                                            e.target.value
                                        );
                                        if (!isNaN(value) && value >= 0) {
                                            field.onChange(value);
                                        } else if (e.target.value === "") {
                                            field.onChange(e.target.value);
                                        }
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Customer Name</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Enter customer name"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                            ? isEditMode
                                ? "Updating..."
                                : "Adding..."
                            : isEditMode
                            ? "Update Sale"
                            : "Add Sale"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
