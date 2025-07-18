import { useState, useCallback } from 'react';
import {
    invoiceAutomationApi,
    InvoiceAutomationRule,
    CreateInvoiceAutomationRuleData,
    UpdateInvoiceAutomationRuleData,
    InvoiceAutomationQuery,
    InvoiceGenerationResult
} from '@/lib/api/invoice-automation';

// Main Invoice Automation Hook
export function useInvoiceAutomation() {
    const [rules, setRules] = useState<InvoiceAutomationRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    const fetchRules = useCallback(async (params?: InvoiceAutomationQuery) => {
        setLoading(true);
        setError(null);

        try {
            const response = await invoiceAutomationApi.getInvoiceAutomationRules(params);
            console.log('Fetched rules:', response);
            setRules(response.data);
            setCount(response.count);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch invoice automation rules');
        } finally {
            setLoading(false);
        }
    }, []);

    const getRule = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await invoiceAutomationApi.getInvoiceAutomationRule(id);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch invoice automation rule');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createRule = useCallback(async (data: CreateInvoiceAutomationRuleData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await invoiceAutomationApi.createInvoiceAutomationRule(data);
            setRules(prev => [response.data, ...prev]);
            setCount(prev => prev + 1);
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create invoice automation rule');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateRule = useCallback(async (id: string, data: UpdateInvoiceAutomationRuleData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await invoiceAutomationApi.updateInvoiceAutomationRule(id, data);
            setRules(prev => prev.map(rule =>
                rule.id === id ? response.data : rule
            ));
            return response.data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update invoice automation rule');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteRule = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);

        try {
            await invoiceAutomationApi.deleteInvoiceAutomationRule(id);
            setRules(prev => prev.filter(rule => rule.id !== id));
            setCount(prev => prev - 1);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete invoice automation rule');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const generateInvoice = useCallback(async (ruleId: string, dateRange?: { start: string; end: string }) => {
        setLoading(true);
        setError(null);

        try {
            const result = await invoiceAutomationApi.generateInvoiceFromRule(ruleId, dateRange);
            return result;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate invoice from rule');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const validateRule = useCallback(async (data: CreateInvoiceAutomationRuleData) => {
        setLoading(true);
        setError(null);

        try {
            const result = await invoiceAutomationApi.validateInvoiceAutomationRule(data);
            return result;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to validate invoice automation rule');
            return { success: false, errors: ['Validation failed'] };
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshRules = useCallback(() => {
        fetchRules();
    }, [fetchRules]);

    return {
        rules,
        loading,
        error,
        count,
        fetchRules,
        getRule,
        createRule,
        updateRule,
        deleteRule,
        generateInvoice,
        validateRule,
        refreshRules,
    };
}

// Invoice Automation Rule Mutation Hook
export function useInvoiceAutomationMutation() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createRule = useCallback(async (data: CreateInvoiceAutomationRuleData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await invoiceAutomationApi.createInvoiceAutomationRule(data);
            setLoading(false);
            return response.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create invoice automation rule';
            setError(errorMessage);
            setLoading(false);
            throw err;
        }
    }, []);

    const updateRule = useCallback(async (id: string, data: UpdateInvoiceAutomationRuleData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await invoiceAutomationApi.updateInvoiceAutomationRule(id, data);
            setLoading(false);
            return response.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update invoice automation rule';
            setError(errorMessage);
            setLoading(false);
            throw err;
        }
    }, []);

    const deleteRule = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await invoiceAutomationApi.deleteInvoiceAutomationRule(id);
            setLoading(false);
            return response.success;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete invoice automation rule';
            setError(errorMessage);
            setLoading(false);
            throw err;
        }
    }, []);

    const generateInvoice = useCallback(async (ruleId: string, dateRange?: { start: string; end: string }) => {
        setLoading(true);
        setError(null);
        try {
            const result = await invoiceAutomationApi.generateInvoiceFromRule(ruleId, dateRange);
            setLoading(false);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate invoice from rule';
            setError(errorMessage);
            setLoading(false);
            throw err;
        }
    }, []);

    const validateRule = useCallback(async (data: CreateInvoiceAutomationRuleData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await invoiceAutomationApi.validateInvoiceAutomationRule(data);
            setLoading(false);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to validate invoice automation rule';
            setError(errorMessage);
            setLoading(false);
            throw err;
        }
    }, []);

    return {
        loading,
        error,
        createRule,
        updateRule,
        deleteRule,
        generateInvoice,
        validateRule,
    };
}
