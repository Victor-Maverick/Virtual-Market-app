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

interface OrderItemDto {
    id: number;
    productId: number;
    productName: string;
    description: string;
    productImage: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    vendorName: string;
    buyerName: string;
    itemStatus: string;
}

interface ReturnResponse {
    id: number;
    reason: string;
    totalAmount: number;
    returnStatus: string;
    buyerEmail: string;
    vendorName: string;
    vendorAddress: string;
    vendorPhone: string;
    item: OrderItemDto;
    createdAt: string;
    updatedAt: string;
}

interface Bank {
    name: string;
    code: string;
}

interface BankListResponse {
    status: boolean;
    message: string;
    data: Bank[];
}

interface ReturnActionsDropdownProps {
    returnItem: ReturnResponse;
    onRequestRefund: (returnItem: ReturnResponse) => void;
    children: React.ReactNode;
}

const ReturnActionsDropdown: React.FC<ReturnActionsDropdownProps> = ({ returnItem, onRequestRefund, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleRequestRefund = () => {
        onRequestRefund(returnItem);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {children}
            </div>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <div className="py-1">
                        {returnItem.returnStatus.toLowerCase() === 'accepted' && (
                            <button
                                onClick={handleRequestRefund}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Request Refund
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const Returns = () => {
    const router = useRouter();
    const [returns, setReturns] = useState<ReturnResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [refundModalOpen, setRefundModalOpen] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState<ReturnResponse | null>(null);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(false);
    const [refundReason, setRefundReason] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

    useEffect(() => {
        const fetchReturns = async () => {
            try {
                const userEmail = localStorage.getItem('userEmail');
                if (!userEmail) {
                    router.push('/login');
                    return;
                }

                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/returns/get-user?email=${userEmail}`
                );

                setReturns(response.data);

            } catch (error) {
                console.error('Error fetching returns:', error);
                toast.error('Failed to load returns');
            } finally {
                setLoading(false);
            }
        };

        fetchReturns();
    }, [router]);

    const fetchBanks = async () => {
        setLoadingBanks(true);
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/payments/banks`
            );
            setBanks(response.data.data || []);
        } catch (error) {
            console.error('Error fetching banks:', error);
            toast.error('Failed to load banks');
        } finally {
            setLoadingBanks(false);
        }
    };

    const handleOpenRefundModal = (returnItem: ReturnResponse) => {
        setSelectedReturn(returnItem);
        setRefundModalOpen(true);
        fetchBanks();
    };

    const handleCloseRefundModal = () => {
        setRefundModalOpen(false);
        setSelectedReturn(null);
        setRefundReason('');
        setAccountNumber('');
        setSelectedBank(null);
    };

    const handleSubmitRefund = async () => {
        if (!selectedReturn || !refundReason || !accountNumber || !selectedBank) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const refundData = {
                itemId: selectedReturn.item.id,
                reason: refundReason,
                accountNumber: accountNumber,
                bankName: selectedBank.name,
                bankCode: selectedBank.code
            };

            await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/refund/request`,
                refundData
            );

            toast.success('Refund request submitted successfully');
            handleCloseRefundModal();
        } catch (error) {
            console.error('Error submitting refund request:', error);
            toast.error('Failed to submit refund request');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED':
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
                        <p className="text-[12px] sm:text-[14px] text-[#3F3E3E]">Home // <span className="font-medium text-[#022B23]">Returns</span></p>
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
                                    <div className="w-[60px] h-[16px] bg-gray-200 animate-pulse rounded my-auto ml-auto"></div>
                                </div>
                                
                                {/* Table rows skeleton */}
                                <SkeletonLoader type="return" count={5} />
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
                    <p className="text-[12px] sm:text-[14px] text-[#3F3E3E]">Home // <span className="font-medium text-[#022B23]">Returns</span></p>
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
                            <div onClick={() => {router.push("/buyer/returns")}} className="w-full bg-[#f8f8f8] text-[#022B23] text-[12px] h-[40px] flex items-center px-[8px]">
                                <p>Returns</p>
                            </div>
                            <div onClick={() => {router.push("/buyer/refunds")}} className="w-full text-[#022B23] text-[12px] h-[40px] rounded-b-[12px] flex items-center px-[8px]">
                                <p>Refunds</p>
                            </div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="flex flex-col w-full lg:w-[779px] gap-4 lg:gap-[24px]">
                        <p className="text-[#000000] text-[14px] sm:text-[16px] font-medium">My Returns ({returns.length})</p>
                        <div className="border-[0.5px] border-[#ededed] rounded-[12px] mb-[50px]">
                            {returns.length === 0 ? (
                                <div className="flex items-center justify-center h-[100px] sm:h-[151px] text-[#3D3D3D] text-[14px]">
                                    <p>No returns yet</p>
                                </div>
                            ) : (
                                returns
                                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                    .map((returnItem, index) => {
                                        const isLastItem = index === returns.length - 1;

                                        return (
                                            <div key={returnItem.id} className={`flex flex-col sm:flex-row items-start sm:items-center ${!isLastItem ? "border-b border-[#ededed]" : "border-none"} p-3 sm:p-0`}>
                                                {/* Mobile layout */}
                                                <div className="flex w-full sm:hidden gap-3 mb-3">
                                                    <div className="w-[80px] h-[80px] rounded-[8px] overflow-hidden flex-shrink-0">
                                                        {returnItem.item.productImage ? (
                                                            <Image
                                                                src={returnItem.item.productImage}
                                                                alt={returnItem.item.productName}
                                                                width={80}
                                                                height={80}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs">
                                                                No image
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[12px] sm:text-[14px] text-[#1E1E1E] font-medium mb-1 truncate">
                                                            {returnItem.item.productName}
                                                        </p>
                                                        <p className="text-[10px] font-normal text-[#3D3D3D] mb-2">
                                                            Vendor: {returnItem.vendorName}
                                                        </p>
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium text-[#1E1E1E] text-[14px]">
                                                                    ₦{Number(returnItem.totalAmount).toLocaleString()}
                                                                </p>
                                                                <p className="text-[#3D3D3D] text-[10px]">
                                                                    {formatDate(returnItem.createdAt)}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`flex h-[32px] px-2 items-center text-[12px] font-medium justify-center rounded-[100px] ${getStatusColor(returnItem.returnStatus)}`}>
                                                                    <p>{returnItem.returnStatus}</p>
                                                                </div>
                                                                {returnItem.returnStatus.toLowerCase() === 'accepted' && (
                                                                    <ReturnActionsDropdown
                                                                        returnItem={returnItem}
                                                                        onRequestRefund={handleOpenRefundModal}
                                                                    >
                                                                        <div className="flex flex-col gap-[2px] cursor-pointer p-2 -m-2">
                                                                            <span className="w-[4px] h-[4px] rounded-full bg-[#7c7c7c]"></span>
                                                                            <span className="w-[4px] h-[4px] rounded-full bg-[#7c7c7c]"></span>
                                                                            <span className="w-[4px] h-[4px] rounded-full bg-[#7c7c7c]"></span>
                                                                        </div>
                                                                    </ReturnActionsDropdown>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Desktop layout */}
                                                <div className="hidden sm:flex items-center w-full h-[151px]">
                                                    <div className="flex border-r border-[#ededed] w-[120px] sm:w-[169px] h-[151px] overflow-hidden">
                                                        {returnItem.item.productImage ? (
                                                            <Image
                                                                src={returnItem.item.productImage}
                                                                alt={returnItem.item.productName}
                                                                width={168}
                                                                height={150}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm">
                                                                No image
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center w-full px-3 sm:px-[20px] justify-between">
                                                        <div className="flex flex-col w-[40%] sm:w-[30%]">
                                                            <div className="mb-[13px]">
                                                                <p className="text-[12px] sm:text-[14px] text-[#1E1E1E] font-medium mb-[4px] line-clamp-2">
                                                                    {returnItem.item.productName}
                                                                </p>
                                                                <p className="text-[10px] font-normal text-[#3D3D3D]">
                                                                    Vendor: {returnItem.vendorName}
                                                                </p>
                                                                <p className="text-[10px] font-normal text-[#3D3D3D] mt-1">
                                                                    Reason: {returnItem.reason}
                                                                </p>
                                                            </div>

                                                            <div className="flex flex-col">
                                                                <p className="font-medium text-[#1E1E1E] text-[14px] sm:text-[16px]">
                                                                    ₦{Number(returnItem.totalAmount).toLocaleString()}
                                                                </p>
                                                                <p className="text-[#3D3D3D] text-[10px]">
                                                                    {formatDate(returnItem.createdAt)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className={`flex h-[36px] sm:h-[42px] px-2 sm:px-3 items-center text-[12px] sm:text-[14px] font-medium justify-center rounded-[100px] ${getStatusColor(returnItem.returnStatus)}`} style={{ width: 'fit-content' }}>
                                                                <p>{returnItem.returnStatus}</p>
                                                            </div>
                                                            {returnItem.returnStatus.toLowerCase() === 'accepted' && (
                                                                <ReturnActionsDropdown
                                                                    returnItem={returnItem}
                                                                    onRequestRefund={handleOpenRefundModal}
                                                                >
                                                                    <div className="flex flex-col gap-[3px] items-center justify-center p-2 -m-2">
                                                                        <div className="w-[3px] h-[3px] bg-[#98A2B3] rounded-full"></div>
                                                                        <div className="w-[3px] h-[3px] bg-[#98A2B3] rounded-full"></div>
                                                                        <div className="w-[3px] h-[3px] bg-[#98A2B3] rounded-full"></div>
                                                                    </div>
                                                                </ReturnActionsDropdown>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {refundModalOpen && selectedReturn && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#808080]/20">
                    <div className="bg-white rounded-lg p-[30px] w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex border-b-[0.5px] pb-3 border-[#ededed] justify-between items-center">
                            <h2 className="text-[16px] text-[#022B23] font-medium">Request Refund</h2>
                            <button onClick={handleCloseRefundModal} className="text-gray-500 hover:text-gray-700">
                                &times;
                            </button>
                        </div>

                        <div className="mt-4">
                            <div className="mb-4">
                                <label htmlFor="refund-reason" className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for Refund *
                                </label>
                                <textarea
                                    id="refund-reason"
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#022B23]"
                                    placeholder="Please describe the reason for requesting a refund..."
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="account-number" className="block text-sm font-medium text-gray-700 mb-2">
                                    Account Number *
                                </label>
                                <input
                                    type="text"
                                    id="account-number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#022B23]"
                                    placeholder="Enter your account number"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="bank-select" className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Bank *
                                </label>
                                {loadingBanks ? (
                                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
                                        Loading banks...
                                    </div>
                                ) : (
                                    <select
                                        id="bank-select"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#022B23]"
                                        value={selectedBank?.code || ''}
                                        onChange={(e) => {
                                            const bank = banks.find(b => b.code === e.target.value);
                                            setSelectedBank(bank || null);
                                        }}
                                        required
                                    >
                                        <option value="">Select a bank</option>
                                        {banks.map((bank) => (
                                            <option key={bank.code} value={bank.code}>
                                                {bank.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={handleCloseRefundModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitRefund}
                                    disabled={!refundReason || !accountNumber || !selectedBank}
                                    className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                                        !refundReason || !accountNumber || !selectedBank
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-[#022B23] hover:bg-[#033a30]'
                                    }`}
                                >
                                    Submit Refund Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

export default Returns;