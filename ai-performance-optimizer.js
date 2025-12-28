#!/usr/bin/env node

/**
 * AI Performance Optimizer
 * Comprehensive optimization for AI model performance
 */

import axios from 'axios';

const OLLAMA_URL = 'http://localhost:11434';
const BACKEND_URL = 'http://localhost:3001';

const models = [
    { name: 'phi3:mini', purpose: 'Fast sentiment analysis', priority: 1 },
    { name: 'llama3.1:8b', purpose: 'Technical analysis', priority: 2 },
    { name: 'mistral:7b', purpose: 'Risk assessment', priority: 3 },
    { name: 'codellama:13b', purpose: 'Strategy analysis', priority: 4 }
];

async function checkOllamaStatus() {
    try {
        const response = await axios.get(`${OLLAMA_URL}/api/ps`);
        return response.data.models || [];
    } catch (error) {
        console.error('❌ Ollama is not running');
        return null;
    }
}

async function preloadModel(modelName, keepAlive = '60m') {
    console.log(`🔥 Preloading ${modelName}...`);

    try {
        const startTime = Date.now();

        // Send a simple prompt to load the model
        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
            model: modelName,
            prompt: 'Ready',
            stream: false,
            keep_alive: keepAlive,
            options: {
                temperature: 0.1,
                max_tokens: 5
            }
        }, { timeout: 120000 }); // 2 minute timeout for loading

        const loadTime = Date.now() - startTime;
        console.log(`✅ ${modelName} loaded in ${loadTime}ms`);
        return true;
    } catch (error) {
        console.log(`❌ Failed to load ${modelName}: ${error.message}`);
        return false;
    }
}

async function testModelResponse(modelName) {
    console.log(`🧪 Testing ${modelName} response time...`);

    try {
        const startTime = Date.now();

        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
            model: modelName,
            prompt: 'AAPL stock analysis: BUY/SELL/HOLD?',
            stream: false,
            options: {
                temperature: 0.1,
                max_tokens: 10
            }
        }, { timeout: 30000 });

        const responseTime = Date.now() - startTime;
        const aiResponse = response.data.response || 'No response';

        console.log(`✅ ${modelName}: ${responseTime}ms - "${aiResponse.substring(0, 50)}..."`);
        return { success: true, time: responseTime, response: aiResponse };
    } catch (error) {
        console.log(`❌ ${modelName}: Failed - ${error.message}`);
        return { success: false, time: 0, response: null };
    }
}

async function optimizeOllamaSettings() {
    console.log('🔧 Optimizing Ollama settings...');

    // Check current settings
    try {
        const response = await axios.get(`${OLLAMA_URL}/api/version`);
        console.log(`✅ Ollama version: ${response.data.version}`);
    } catch (error) {
        console.log('❌ Cannot connect to Ollama');
        return false;
    }

    return true;
}

async function testBackendPerformance() {
    console.log('🧪 Testing backend AI ensemble performance...');

    try {
        const startTime = Date.now();

        const response = await axios.post(`${BACKEND_URL}/api/ai/ensemble`, {
            symbol: 'AAPL',
            portfolio_value: 100000
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 120000 // 2 minutes
        });

        const responseTime = Date.now() - startTime;
        const data = response.data;

        console.log(`✅ Backend ensemble: ${responseTime}ms`);
        console.log(`   Recommendation: ${data.recommendation} (${Math.round(data.confidence * 100)}%)`);
        console.log(`   Models responded: ${data.ensemble.models_responded}/${data.ensemble.models_total}`);

        // Check which models are working
        Object.entries(data.analyses).forEach(([type, analysis]) => {
            const isWorking = !analysis.analysis.includes('Fallback:');
            console.log(`   ${type}: ${isWorking ? '✅' : '❌'} ${isWorking ? 'AI' : 'Fallback'}`);
        });

        return data;
    } catch (error) {
        console.log(`❌ Backend test failed: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log('🚀 AI Performance Optimizer Starting...\n');

    // Step 1: Check Ollama status
    console.log('📊 Step 1: Checking Ollama status...');
    const loadedModels = await checkOllamaStatus();
    if (!loadedModels) return;

    console.log(`Currently loaded models: ${loadedModels.length}`);
    loadedModels.forEach(model => {
        console.log(`  - ${model.name}: ${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB`);
    });

    // Step 2: Optimize Ollama settings
    console.log('\n🔧 Step 2: Optimizing Ollama settings...');
    await optimizeOllamaSettings();

    // Step 3: Preload all models
    console.log('\n🔥 Step 3: Preloading all models...');
    for (const model of models) {
        await preloadModel(model.name);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between models
    }

    // Step 4: Test individual model responses
    console.log('\n🧪 Step 4: Testing individual model responses...');
    const testResults = {};
    for (const model of models) {
        testResults[model.name] = await testModelResponse(model.name);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
    }

    // Step 5: Test backend ensemble
    console.log('\n🎯 Step 5: Testing backend ensemble performance...');
    const ensembleResult = await testBackendPerformance();

    // Step 6: Generate report
    console.log('\n📊 Performance Report:');
    console.log('='.repeat(50));

    let workingModels = 0;
    models.forEach(model => {
        const result = testResults[model.name];
        if (result.success) {
            workingModels++;
            console.log(`✅ ${model.name}: ${result.time}ms - ${model.purpose}`);
        } else {
            console.log(`❌ ${model.name}: Failed - ${model.purpose}`);
        }
    });

    console.log(`\n📈 Summary:`);
    console.log(`   Working models: ${workingModels}/${models.length} (${Math.round(workingModels / models.length * 100)}%)`);

    if (ensembleResult) {
        const realAI = Object.values(ensembleResult.analyses).filter(a => !a.analysis.includes('Fallback:')).length;
        console.log(`   Real AI responses: ${realAI}/4 (${Math.round(realAI / 4 * 100)}%)`);
        console.log(`   Backend response time: ${ensembleResult.performance.response_time_ms}ms`);
    }

    // Recommendations
    console.log(`\n💡 Recommendations:`);
    if (workingModels < models.length) {
        console.log(`   - Increase timeout settings for failing models`);
        console.log(`   - Consider using smaller/faster models for production`);
        console.log(`   - Ensure sufficient RAM (recommend 16GB+ for all 4 models)`);
    }
    if (ensembleResult && ensembleResult.performance.response_time_ms > 10000) {
        console.log(`   - Response time is high - consider parallel processing`);
        console.log(`   - Implement better caching mechanisms`);
    }

    console.log(`\n✅ Optimization complete!`);
}

main().catch(console.error);
