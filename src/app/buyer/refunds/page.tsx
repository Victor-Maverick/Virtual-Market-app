'use client'
import MarketPlaceHeader from "@/components/marketPlaceHeader";
import Image from "next/image";
import arrowRight from "../../../../public/assets/images/greyforwardarrow.svg";
import React, {useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import axios from "axios";
import {ToastContainer, toast} from "react-toastify";
import { SkeletonLoader } from '@/components/LoadingSkeletons';

interface RefundResponse {
    id: number;
    orderId: number;
    orderNumber: string;
    buyerEmail: string;
    buyerName: string;
    vendorEmail: string;
    vendorName: string;
    shopName: string;
    refundAmount: number;
    reason: string;
    description: string;
    status: string;
    processedBy: string;
    refundReference: string;
    adminNotes: string;
    createdAt: string;
    processedAt: string;
}

const Refunds = () => {
    const router = useRouter();
    const [refunds, setRefunds] = useState<RefundResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRefunds = async () => {
            try {
                const userEmail = localStorage.getItem('userEmail');
                if (!userEmail) {
                    router.push('/login');
                    return;
                }

                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/refund/user?email=${userEmail}`
                );

                setRefunds(response.data);
            } catch (error) {
                console.error('Error fetching refunds:', error);
                toast.error('Failed to load refunds');
            } finally {
                setLoading(false);
            }
        };

        fetchRefunds();
    }, [router]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED':
            case 'PROCESSED':
                return 'bg-[#F9FDE8] text-[#0C4F24]';
            case 'PENDING':
                return 'bg-[#FFFAEB] text-[#B54708]';
            case 'REJECTED':
                return 'bg-[#FFEBEB] text-[#F90707]';
            default:
                return 'bg-[#E7E7E7] text-[#1E1E1E]';
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading) {
        return (
            <>
                <MarketPlaceHeader />
                <div className="h-[48px] w-full border-y-[0.5px] border-[#EDEDED]">
                    <div className="h-[48px] px-4 sm:px-6 lg:px-25 gap-[8px] items-center flex">
                        <BackButton variant="default" text="Go back" />
                        <p className="text-[12px] sm:text-[14px] text-[#3F3E3E]">Home // <span className="font-medium text-[#022B23]">Refunds</span></p>
                    </div>
                </div>
                <div className="px-4 sm:px-6 lg:px-25 pt-4 sm:pt-8 lg:pt-[62px] h-auto w-full">
                    <div className="flex flex-col lg:flex-row gap-4 lg:gap-[30px]">
                        {/* Sidebar skeleton */}
                        <div className="flex flex-col lg:block">
                            <div className="w-full lg:w-[381px] h-[44px] bg-gray-200 animate-pulse rounded-[10px] mb-2 lg:mb-0"></div>
                            <div className="w-full lg:w-[381px] h-[200px] bg-gray-200 animate-pulse rounded-[12px] mt-0 lg:mt-[6px]"></div>
                        </div>
                        
                        {/* Main content skeleton */}
                        <div className="flex flex-col w-full lg:w-[779px] gap-4 lg:gap-[24px]">
                            <div className="w-[200px] h-[20px] bg-gray-200 animate-pulse rounded"></div>
                            <div className="border-[0.5px] border-[#ededed] rounded-[12px] mb-[50px]">
                                {/* Table header skeleton */}
                                <div className="hidden sm:flex h-[44px] bg-[#F9FAFB] border-b-[1px] border-[#EAECF0] px-6">
                                    <div className="w-[100px] h-[16px] bg-gray-200 animate-pulse rounded my-auto"></div>
                                    <div className="w-[80px] h-[16px] bg-gray-200 animate-pulse rounded my-auto ml-auto"></div>
                                    <div className="w-[80px] h-[16px] bg-gray-200 animate-pulse rounded my-auto ml-auto"></div>
                                    <div className="w-[100px] h-[16px] bg-gray-200 animate-pulse rounded my-auto ml-auto"></div>
                                    <div className="w-[80px] h-[16px] bg-gray-200 animate-pulse rounded my-auto ml-auto"></div>
                                </div>
                                
                                {/* Table rows skeleton */}
                                <SkeletonLoader type="list" count={5} />
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <MarketPlaceHeader />
            <div className="h-[48px] w-full border-y-[0.5px] border-[#EDEDED]">
                <div className="h-[48px] px-4 sm:px-6 lg:px-25 gap-[8px] items-center flex">
                    <BackButton variant="default" text="Go back" />
                    <p className="text-[12px] sm:text-[14px] text-[#3F3E3E]">Home // <span className="font-medium text-[#022B23]">Refunds</span></p>
                </div>
            </div>
            <div className="px-4 sm:px-6 lg:px-25 pt-4 sm:pt-8 lg:pt-[62px] h-auto w-full">
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-[30px]">
                    {/* Sidebar */}
                    <div className="flex flex-col lg:block">
                        <div className="w-full lg:w-[381px] text-[#022B23] text-[12px] font-medium h-[44px] bg-[#f8f8f8] rounded-[10px] flex items-center px-[8px] justify-between mb-2 lg:mb-0">
                            <p>Go to profile</p>
                            <Image src={arrowRight} alt={'image'}/>
                        </div>
                        <div className="flex flex-col h-auto w-[381px] mt-[6px] rounded-[12px] border border-[#eeeeee]">
                            <div onClick={() => {router.push("/buyer/wishlist")}} className="w-full text-[#022B23] text-[12px] font-medium h-[40px] rounded-t-[12px] flex items-center px-[8px]">
                                <p>Wishlist</p>
                            </div>
                            <div onClick={() => {router.push("/buyer/orders")}} className="w-full text-[#022B23] text-[12px] h-[40px] flex items-center px-[8px]">
                                <p>My orders</p>
                            </div>
                            <div onClick={() => {router.push("/buyer/disputes")}} className="w-full text-[#022B23] text-[12px] h-[40px] flex items-center px-[8px]">
                                <p>Order disputes</p>
                            </div>
                            <div onClick={() => {router.push("/buyer/returns")}} className="w-full text-[#022B23] text-[12px] h-[40px] flex items-center px-[8px]">
                                <p>Returns</p>
                            </div>
                            <div onClick={() => {router.push("/buyer/refunds")}} className="w-full bg-[#f8f8f8] text-[#022B23] text-[12px] h-[40px] rounded-b-[12px] flex items-center px-[8px]">
                                <p>Refunds</p>
                            </div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="flex flex-col w-full lg:w-[779px] gap-4 lg:gap-[24px]">
                        <p className="text-[#000000] text-[14px] sm:text-[16px] font-medium">My Refunds ({refunds.length})</p>
                        <div className="border-[0.5px] border-[#ededed] rounded-[12px] mb-[50px]">
                            {refunds.length === 0 ? (
                                <div className="flex items-center justify-center h-[100px] sm:h-[151px] text-[#3D3D3D] text-[14px]">
                                    <p>No refunds yet</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[#f8f8f8] border-b border-[#ededed]">
                                            <tr>
                                                <th className="text-left p-4 text-[12px] font-medium text-[#7c7c7c]">Order #</th>
                                                <th className="text-left p-4 text-[12px] font-medium text-[#7c7c7c]">Shop</th>
                                                <th className="text-left p-4 text-[12px] font-medium text-[#7c7c7c]">Amount</th>
                                                <th className="text-left p-4 text-[12px] font-medium text-[#7c7c7c]">Reason</th>
                                                <th className="text-left p-4 text-[12px] font-medium text-[#7c7c7c]">Status</th>
                                                <th className="text-left p-4 text-[12px] font-medium text-[#7c7c7c]">Date</th>
                                                <th className="text-left p-4 text-[12px] font-medium text-[#7c7c7c]">Reference</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {refunds
                                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                                .map((refund, index) => {
                                                    const isLastItem = index === refunds.length - 1;
                                                    return (
                                                        <tr key={refund.id} className={`${!isLastItem ? "border-b border-[#ededed]" : ""}`}>
                                                            <td className="p-4">
                                                                <p className="text-[14px] font-medium text-[#1E1E1E]">#{refund.orderNumber}</p>
                                                            </td>
                                                            <td className="p-4">
                                                                <p className="text-[14px] text-[#1E1E1E]">{refund.shopName}</p>
                                                                <p className="text-[12px] text-[#7c7c7c]">{refund.vendorName}</p>
                                                            </td>
                                                            <td className="p-4">
                                                                <p className="text-[14px] font-medium text-[#1E1E1E]">
                                                                    ₦{Number(refund.refundAmount).toLocaleString()}
                                                                </p>
                                                            </td>
                                                            <td className="p-4">
                                                                <p className="text-[14px] text-[#1E1E1E]">{refund.reason}</p>
                                                                {refund.description && (
                                                                    <p className="text-[12px] text-[#7c7c7c] mt-1">{refund.description}</p>
                                                                )}
                                                            </td>
                                                            <td className="p-4">
                                                                <div className={`inline-flex h-[32px] px-3 items-center text-[12px] font-medium justify-center rounded-[100px] ${getStatusColor(refund.status)}`}>
                                                                    <p>{refund.status}</p>
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <p className="text-[14px] text-[#1E1E1E]">{formatDate(refund.createdAt)}</p>
                                                                {refund.processedAt && (
                                                                    <p className="text-[12px] text-[#7c7c7c]">Processed: {formatDate(refund.processedAt)}</p>
                                                                )}
                                                            </td>
                                                            <td className="p-4">
                                                                <p className="text-[14px] text-[#1E1E1E]">{refund.refundReference || 'N/A'}</p>
                                                                {refund.adminNotes && (
                                                                    <p className="text-[12px] text-[#7c7c7c] mt-1">{refund.adminNotes}</p>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </>
    );
};

export default Refunds;