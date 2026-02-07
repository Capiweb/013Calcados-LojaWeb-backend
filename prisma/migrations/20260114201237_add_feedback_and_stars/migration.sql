-- AlterTable
-- ALTER TABLE "Produto" ADD COLUMN     "estrelas" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "estrelas" DOUBLE PRECISION NOT NULL,
    "comentario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
-- CREATE TABLE "_ProdutoToUsuario" (
--     "A" TEXT NOT NULL,
--     "B" TEXT NOT NULL,
-- 
--     CONSTRAINT "_ProdutoToUsuario_AB_pkey" PRIMARY KEY ("A","B")
-- );

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Feedback_usuarioId_produtoId_key" ON "Feedback"("usuarioId", "produtoId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_ProdutoToUsuario_B_index" ON "_ProdutoToUsuario"("B");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Feedback_usuarioId_fkey') THEN
        ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Feedback_produtoId_fkey') THEN
        ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ProdutoToUsuario_A_fkey') THEN
        ALTER TABLE "_ProdutoToUsuario" ADD CONSTRAINT "_ProdutoToUsuario_A_fkey" FOREIGN KEY ("A") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_ProdutoToUsuario_B_fkey') THEN
        ALTER TABLE "_ProdutoToUsuario" ADD CONSTRAINT "_ProdutoToUsuario_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;
