-- AlterTable
ALTER TABLE "Feedback" ALTER COLUMN "estrelas" SET DEFAULT 0.0;

-- AlterTable
ALTER TABLE "Produto" ADD COLUMN     "imagemPublicIds" TEXT[],
ADD COLUMN     "imagemUrls" TEXT[];

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "telefone" TEXT;
