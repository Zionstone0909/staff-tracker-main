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

// Updated schema to match API
const formSchema = z.object({
    name: z
        .string()
        .min(2, { message: "Product name must be at least 2 characters." }),
    sku: z.string().min(1, { message: "SKU is required." }),
    description: z.string().optional(),
    quantity: z.coerce
        .number()
        .int()
        .positive({ message: "Quantity must be a positive number." }),
    price: z.coerce
        .number()
        .positive({ message: "Price must be a positive number." })
        .transform((val) => Number.parseFloat(val.toFixed(2))),
});

export type StockFormValues = z.infer<typeof formSchema>;

type StockFormProps = {
    onBack: () => void;
    onSubmit: (data: StockFormValues) => void;
    editItem?: StockFormValues | null;
};

export function StockForm({
    onBack,
    onSubmit,
    editItem = null,
}: StockFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!editItem;

    const form = useForm<StockFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            sku: "",
            description: "",
            quantity: undefined,
            price: undefined,
        },
    });

    // Pre-fill form when in edit mode
    useEffect(() => {
        if (editItem) {
            form.reset(editItem);
        }
    }, [editItem, form]);

    async function handleSubmit(values: StockFormValues) {
        setIsSubmitting(true);
        await onSubmit(values);
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
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Enter product name"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>SKU</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Enter SKU (e.g. p-4)"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Enter product description"
                                    {...field}
                                />
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
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter price"
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

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                            ? isEditMode
                                ? "Updating..."
                                : "Adding..."
                            : isEditMode
                            ? "Update Product"
                            : "Add Product"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
