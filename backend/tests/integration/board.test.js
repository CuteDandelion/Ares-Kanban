"use strict";
/**
 * Backend Integration Tests - Board API Routes
 *
 * Tests API routes against real PostgreSQL database with proper test isolation.
 * Each test is wrapped in its own transaction and rolled back to ensure no side effects.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const board_1 = __importDefault(require("../../src/routes/board"));
const test_helpers_1 = require("../utils/test-helpers");
describe('Board API - Integration Tests (Real Database)', () => {
    let app;
    let pool;
    let db;
    // Helper to generate non-existent valid UUID
    const nonExistentUuid = '00000000-0000-0000-0000-000000000001';
    beforeAll(async () => {
        // Get test pool from global setup
        pool = global.testPool;
        // Create Express app with routes
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use('/api/board', board_1.default);
        // Initialize database helper
        db = new test_helpers_1.DatabaseHelper(pool);
    });
    beforeEach(async () => {
        // Ensure clean state before each test
        await db.cleanup();
    });
    afterAll(async () => {
        // Final cleanup after all tests
        await db.cleanup();
    });
    describe('GET /api/board/columns', () => {
        let testUser;
        let testBoard;
        let testColumns;
        beforeEach(async () => {
            // Setup fresh test data for each test
            testUser = (0, test_helpers_1.createTestUser)();
            testBoard = (0, test_helpers_1.createTestBoard)({ user_id: testUser.id });
            testColumns = (0, test_helpers_1.createTestColumns)(3, testBoard.id);
            await db.insertUser(testUser);
            await db.insertBoard(testBoard);
            for (const column of testColumns) {
                await db.insertColumn(column);
            }
        });
        test('should return empty array when no columns exist', async () => {
            await db.cleanup(); // Remove all data
            const response = await (0, supertest_1.default)(app)
                .get('/api/board/columns')
                .expect('Content-Type', /json/)
                .expect(200);
            expect(response.body).toEqual([]);
            expect(Array.isArray(response.body)).toBe(true);
        });
        test('should return all columns ordered by position', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/board/columns')
                .expect(200);
            expect(response.body).toHaveLength(3);
            (0, test_helpers_1.assertSortedBy)(response.body, 'position', 'asc');
            expect(response.body[0].position).toBe(0);
            expect(response.body[1].position).toBe(1);
            expect(response.body[2].position).toBe(2);
        });
        test('should return columns with correct structure', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/board/columns')
                .expect(200);
            expect(response.body[0]).toHaveProperty('id');
            expect(response.body[0]).toHaveProperty('name');
            expect(response.body[0]).toHaveProperty('board_id');
            expect(response.body[0]).toHaveProperty('position');
            expect(response.body[0]).toHaveProperty('created_at');
            expect(response.body[0]).toHaveProperty('updated_at');
        });
    });
    describe('GET /api/board/columns/:id', () => {
        let testUser;
        let testBoard;
        let testColumn;
        beforeEach(async () => {
            testUser = (0, test_helpers_1.createTestUser)();
            testBoard = (0, test_helpers_1.createTestBoard)({ user_id: testUser.id });
            testColumn = (0, test_helpers_1.createTestColumn)({ board_id: testBoard.id });
            await db.insertUser(testUser);
            await db.insertBoard(testBoard);
            await db.insertColumn(testColumn);
        });
        test('should return single column by ID', async () => {
            const response = await (0, supertest_1.default)(app)
                .get(`/api/board/columns/${testColumn.id}`)
                .expect(200);
            expect(response.body.id).toBe(testColumn.id);
            expect(response.body.name).toBe(testColumn.name);
        });
        test('should return 404 for non-existent column', async () => {
            const response = await (0, supertest_1.default)(app)
                .get(`/api/board/columns/${nonExistentUuid}`)
                .expect(404);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('POST /api/board/columns', () => {
        let testUser;
        let testBoard;
        beforeEach(async () => {
            testUser = (0, test_helpers_1.createTestUser)();
            testBoard = (0, test_helpers_1.createTestBoard)({ user_id: testUser.id });
            await db.insertUser(testUser);
            await db.insertBoard(testBoard);
        });
        test('should create new column with valid data', async () => {
            const newColumn = {
                name: 'New Column',
                board_id: testBoard.id,
                position: 0,
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/board/columns')
                .send(newColumn)
                .expect(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe(newColumn.name);
            expect(response.body.board_id).toBe(testBoard.id);
            expect(response.body.position).toBe(newColumn.position);
        });
        test('should return 400 when no board available', async () => {
            await db.cleanup();
            const newColumn = {
                name: 'No Board Column',
                position: 0,
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/board/columns')
                .send(newColumn)
                .expect(400);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('PUT /api/board/columns/:id', () => {
        let testUser;
        let testBoard;
        let testColumn;
        beforeEach(async () => {
            testUser = (0, test_helpers_1.createTestUser)();
            testBoard = (0, test_helpers_1.createTestBoard)({ user_id: testUser.id });
            testColumn = (0, test_helpers_1.createTestColumn)({ board_id: testBoard.id, name: 'Original Name' });
            await db.insertUser(testUser);
            await db.insertBoard(testBoard);
            await db.insertColumn(testColumn);
        });
        test('should update column name', async () => {
            const updateData = { name: 'Updated Name' };
            const response = await (0, supertest_1.default)(app)
                .put(`/api/board/columns/${testColumn.id}`)
                .send(updateData)
                .expect(200);
            expect(response.body.name).toBe(updateData.name);
        });
        test('should update column position', async () => {
            const updateData = { position: 5 };
            const response = await (0, supertest_1.default)(app)
                .put(`/api/board/columns/${testColumn.id}`)
                .send(updateData)
                .expect(200);
            expect(response.body.position).toBe(updateData.position);
        });
        test('should return 404 for non-existent column', async () => {
            const response = await (0, supertest_1.default)(app)
                .put(`/api/board/columns/${nonExistentUuid}`)
                .send({ name: 'Updated' })
                .expect(404);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('DELETE /api/board/columns/:id', () => {
        let testUser;
        let testBoard;
        let testColumn;
        let testCards;
        beforeEach(async () => {
            testUser = (0, test_helpers_1.createTestUser)();
            testBoard = (0, test_helpers_1.createTestBoard)({ user_id: testUser.id });
            testColumn = (0, test_helpers_1.createTestColumn)({ board_id: testBoard.id });
            testCards = (0, test_helpers_1.createTestCards)(2, testColumn.id);
            await db.insertUser(testUser);
            await db.insertBoard(testBoard);
            await db.insertColumn(testColumn);
            for (const card of testCards) {
                await db.insertCard(card);
            }
        });
        test('should delete column successfully', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/board/columns/${testColumn.id}`)
                .expect(200);
            expect(response.body).toHaveProperty('message');
        });
        test('should cascade delete all cards in column', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/board/columns/${testColumn.id}`)
                .expect(200);
            // Verify cards were deleted (column doesn't exist)
            const cardsResponse = await (0, supertest_1.default)(app)
                .get(`/api/board/cards?column_id=${testColumn.id}`)
                .expect(200);
            expect(cardsResponse.body).toEqual([]);
        });
        test('should return 404 for non-existent column', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/board/columns/${nonExistentUuid}`)
                .expect(404);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('PUT /api/board/columns/reorder', () => {
        let testUser;
        let testBoard;
        let testColumns;
        beforeEach(async () => {
            testUser = (0, test_helpers_1.createTestUser)();
            testBoard = (0, test_helpers_1.createTestBoard)({ user_id: testUser.id });
            testColumns = (0, test_helpers_1.createTestColumns)(3, testBoard.id);
            await db.insertUser(testUser);
            await db.insertBoard(testBoard);
            for (const column of testColumns) {
                await db.insertColumn(column);
            }
        });
        test('should reorder multiple columns', async () => {
            const reorderData = {
                columns: [
                    { id: testColumns[1].id, position: 0 },
                    { id: testColumns[2].id, position: 1 },
                    { id: testColumns[0].id, position: 2 },
                ],
            };
            const response = await (0, supertest_1.default)(app)
                .put('/api/board/columns/reorder')
                .send(reorderData)
                .expect(200);
            expect(response.body).toHaveProperty('message');
        });
        test('should handle reorder with non-existent columns gracefully', async () => {
            const reorderData = {
                columns: [
                    { id: nonExistentUuid, position: 0 },
                    { id: testColumns[0].id, position: 1 },
                ],
            };
            const response = await (0, supertest_1.default)(app)
                .put('/api/board/columns/reorder')
                .send(reorderData)
                .expect(200);
            expect(response.body).toHaveProperty('message');
        });
    });
    describe('GET /api/board/cards', () => {
        let testUser;
        let testBoard;
        let testColumn;
        let testCards;
        beforeEach(async () => {
            testUser = (0, test_helpers_1.createTestUser)();
            testBoard = (0, test_helpers_1.createTestBoard)({ user_id: testUser.id });
            testColumn = (0, test_helpers_1.createTestColumn)({ board_id: testBoard.id });
            testCards = (0, test_helpers_1.createTestCards)(3, testColumn.id);
            await db.insertUser(testUser);
            await db.insertBoard(testBoard);
            await db.insertColumn(testColumn);
            for (const card of testCards) {
                await db.insertCard(card);
            }
        });
        test('should return all cards ordered by created_at DESC', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/board/cards')
                .expect(200);
            expect(response.body).toHaveLength(3);
            (0, test_helpers_1.assertSortedBy)(response.body, 'created_at', 'desc');
        });
        test('should filter cards by column_id', async () => {
            const response = await (0, supertest_1.default)(app)
                .get(`/api/board/cards?column_id=${testColumn.id}`)
                .expect(200);
            expect(response.body).toHaveLength(3);
            for (const card of response.body) {
                expect(card.column_id).toBe(testColumn.id);
            }
        });
    });
    describe('GET /api/board/cards/:id', () => {
        let testUser;
        let testBoard;
        let testColumn;
        let testCard;
        beforeEach(async () => {
            testUser = (0, test_helpers_1.createTestUser)();
            testBoard = (0, test_helpers_1.createTestBoard)({ user_id: testUser.id });
            testColumn = (0, test_helpers_1.createTestColumn)({ board_id: testBoard.id });
            testCard = (0, test_helpers_1.createTestCard)({
                column_id: testColumn.id,
                title: 'Test Card',
                description: 'Test Description',
            });
            await db.insertUser(testUser);
            await db.insertBoard(testBoard);
            await db.insertColumn(testColumn);
            await db.insertCard(testCard);
        });
        test('should return single card by ID', async () => {
            const response = await (0, supertest_1.default)(app)
                .get(`/api/board/cards/${testCard.id}`)
                .expect(200);
            expect(response.body.id).toBe(testCard.id);
            expect(response.body.title).toBe(testCard.title);
            expect(response.body.description).toBe(testCard.description);
        });
        test('should return 404 for non-existent card', async () => {
            const response = await (0, supertest_1.default)(app)
                .get(`/api/board/cards/${nonExistentUuid}`)
                .expect(404);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('POST /api/board/cards', () => {
        let testUser;
        let testBoard;
        let testColumn;
        beforeEach(async () => {
            testUser = (0, test_helpers_1.createTestUser)();
            testBoard = (0, test_helpers_1.createTestBoard)({ user_id: testUser.id });
            testColumn = (0, test_helpers_1.createTestColumn)({ board_id: testBoard.id });
            await db.insertUser(testUser);
            await db.insertBoard(testBoard);
            await db.insertColumn(testColumn);
        });
        test('should create new card with valid data', async () => {
            const newCard = {
                column_id: testColumn.id,
                title: 'New Card',
                description: 'New Description',
                position: 0,
                metadata: { priority: 'high' },
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/board/cards')
                .send(newCard)
                .expect(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe(newCard.title);
            expect(response.body.description).toBe(newCard.description);
            expect(response.body.column_id).toBe(testColumn.id);
            expect(response.body.metadata).toEqual(newCard.metadata);
        });
        test('should create card without optional fields', async () => {
            const minimalCard = {
                column_id: testColumn.id,
                title: 'Minimal Card',
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/board/cards')
                .send(minimalCard)
                .expect(201);
            expect(response.body.title).toBe(minimalCard.title);
            expect(response.body.description).toBeNull();
            expect(response.body.position).toBeNull();
            expect(response.body.metadata).toEqual({});
        });
    });
    describe('PUT /api/board/cards/:id', () => {
        let testUser;
        let testBoard;
        let testColumn;
        let testCard;
        beforeEach(async () => {
            testUser = (0, test_helpers_1.createTestUser)();
            testBoard = (0, test_helpers_1.createTestBoard)({ user_id: testUser.id });
            testColumn = (0, test_helpers_1.createTestColumn)({ board_id: testBoard.id });
            testCard = (0, test_helpers_1.createTestCard)({
                column_id: testColumn.id,
                title: 'Original Title',
            });
            await db.insertUser(testUser);
            await db.insertBoard(testBoard);
            await db.insertColumn(testColumn);
            await db.insertCard(testCard);
        });
        test('should update card title', async () => {
            const updateData = { title: 'Updated Title' };
            const response = await (0, supertest_1.default)(app)
                .put(`/api/board/cards/${testCard.id}`)
                .send(updateData)
                .expect(200);
            expect(response.body.title).toBe(updateData.title);
        });
        test('should move card to different column', async () => {
            const secondColumn = (0, test_helpers_1.createTestColumn)({ board_id: testBoard.id });
            await db.insertColumn(secondColumn);
            const updateData = { column_id: secondColumn.id, position: 0 };
            const response = await (0, supertest_1.default)(app)
                .put(`/api/board/cards/${testCard.id}`)
                .send(updateData)
                .expect(200);
            expect(response.body.column_id).toBe(secondColumn.id);
            expect(response.body.position).toBe(0);
        });
        test('should return 404 for non-existent card', async () => {
            const response = await (0, supertest_1.default)(app)
                .put(`/api/board/cards/${nonExistentUuid}`)
                .send({ title: 'Updated' })
                .expect(404);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('DELETE /api/board/cards/:id', () => {
        let testUser;
        let testBoard;
        let testColumn;
        let testCard;
        beforeEach(async () => {
            testUser = (0, test_helpers_1.createTestUser)();
            testBoard = (0, test_helpers_1.createTestBoard)({ user_id: testUser.id });
            testColumn = (0, test_helpers_1.createTestColumn)({ board_id: testBoard.id });
            testCard = (0, test_helpers_1.createTestCard)({
                column_id: testColumn.id,
                title: 'To Delete',
            });
            await db.insertUser(testUser);
            await db.insertBoard(testBoard);
            await db.insertColumn(testColumn);
            await db.insertCard(testCard);
        });
        test('should delete card successfully', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/board/cards/${testCard.id}`)
                .expect(200);
            expect(response.body).toHaveProperty('message');
        });
        test('should return 404 for non-existent card', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete(`/api/board/cards/${nonExistentUuid}`)
                .expect(404);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('PATCH /api/board/cards/:id/move', () => {
        let testUser;
        let testBoard;
        let testColumn;
        let testCard;
        beforeEach(async () => {
            testUser = (0, test_helpers_1.createTestUser)();
            testBoard = (0, test_helpers_1.createTestBoard)({ user_id: testUser.id });
            testColumn = (0, test_helpers_1.createTestColumn)({ board_id: testBoard.id });
            testCard = (0, test_helpers_1.createTestCard)({
                column_id: testColumn.id,
                title: 'To Move',
            });
            await db.insertUser(testUser);
            await db.insertBoard(testBoard);
            await db.insertColumn(testColumn);
            await db.insertCard(testCard);
        });
        test('should move card to another column', async () => {
            const secondColumn = (0, test_helpers_1.createTestColumn)({ board_id: testBoard.id });
            await db.insertColumn(secondColumn);
            const moveData = { column_id: secondColumn.id, position: 0 };
            const response = await (0, supertest_1.default)(app)
                .patch(`/api/board/cards/${testCard.id}/move`)
                .send(moveData)
                .expect(200);
            expect(response.body.column_id).toBe(secondColumn.id);
            expect(response.body.position).toBe(0);
        });
        test('should update position within same column', async () => {
            const moveData = { column_id: testColumn.id, position: 10 };
            const response = await (0, supertest_1.default)(app)
                .patch(`/api/board/cards/${testCard.id}/move`)
                .send(moveData)
                .expect(200);
            expect(response.body.position).toBe(10);
            expect(response.body.column_id).toBe(testColumn.id);
        });
        test('should return 404 for non-existent card', async () => {
            const response = await (0, supertest_1.default)(app)
                .patch(`/api/board/cards/${nonExistentUuid}/move`)
                .send({ column_id: testColumn.id, position: 0 })
                .expect(404);
            expect(response.body).toHaveProperty('error');
        });
    });
});
