using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Database.Migrations
{
    /// <inheritdoc />
    public partial class DepotMigrations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PasswordReset_Users_UserId",
                table: "PasswordReset");

            migrationBuilder.DropForeignKey(
                name: "FK_WaitingList_Cars_CarId",
                table: "WaitingList");

            migrationBuilder.DropForeignKey(
                name: "FK_WaitingList_Users_UserId",
                table: "WaitingList");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WaitingList",
                table: "WaitingList");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PasswordReset",
                table: "PasswordReset");

            migrationBuilder.RenameTable(
                name: "WaitingList",
                newName: "WaitingLists");

            migrationBuilder.RenameTable(
                name: "PasswordReset",
                newName: "PasswordResets");

            migrationBuilder.RenameIndex(
                name: "IX_WaitingList_UserId",
                table: "WaitingLists",
                newName: "IX_WaitingLists_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_WaitingList_CarId",
                table: "WaitingLists",
                newName: "IX_WaitingLists_CarId");

            migrationBuilder.RenameIndex(
                name: "IX_PasswordReset_UserId",
                table: "PasswordResets",
                newName: "IX_PasswordResets_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_PasswordReset_Token",
                table: "PasswordResets",
                newName: "IX_PasswordResets_Token");

            migrationBuilder.AddColumn<int>(
                name: "DepotId",
                table: "Cars",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_WaitingLists",
                table: "WaitingLists",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PasswordResets",
                table: "PasswordResets",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "Depots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    ZipCode = table.Column<string>(type: "text", nullable: false),
                    City = table.Column<string>(type: "text", nullable: false),
                    Street = table.Column<string>(type: "text", nullable: false),
                    HouseNumber = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Depots", x => x.Id);
                });

            migrationBuilder.AddForeignKey(
                name: "FK_PasswordResets_Users_UserId",
                table: "PasswordResets",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WaitingLists_Cars_CarId",
                table: "WaitingLists",
                column: "CarId",
                principalTable: "Cars",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WaitingLists_Users_UserId",
                table: "WaitingLists",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PasswordResets_Users_UserId",
                table: "PasswordResets");

            migrationBuilder.DropForeignKey(
                name: "FK_WaitingLists_Cars_CarId",
                table: "WaitingLists");

            migrationBuilder.DropForeignKey(
                name: "FK_WaitingLists_Users_UserId",
                table: "WaitingLists");

            migrationBuilder.DropTable(
                name: "Depots");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WaitingLists",
                table: "WaitingLists");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PasswordResets",
                table: "PasswordResets");

            migrationBuilder.DropColumn(
                name: "DepotId",
                table: "Cars");

            migrationBuilder.RenameTable(
                name: "WaitingLists",
                newName: "WaitingList");

            migrationBuilder.RenameTable(
                name: "PasswordResets",
                newName: "PasswordReset");

            migrationBuilder.RenameIndex(
                name: "IX_WaitingLists_UserId",
                table: "WaitingList",
                newName: "IX_WaitingList_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_WaitingLists_CarId",
                table: "WaitingList",
                newName: "IX_WaitingList_CarId");

            migrationBuilder.RenameIndex(
                name: "IX_PasswordResets_UserId",
                table: "PasswordReset",
                newName: "IX_PasswordReset_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_PasswordResets_Token",
                table: "PasswordReset",
                newName: "IX_PasswordReset_Token");

            migrationBuilder.AddPrimaryKey(
                name: "PK_WaitingList",
                table: "WaitingList",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PasswordReset",
                table: "PasswordReset",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PasswordReset_Users_UserId",
                table: "PasswordReset",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WaitingList_Cars_CarId",
                table: "WaitingList",
                column: "CarId",
                principalTable: "Cars",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WaitingList_Users_UserId",
                table: "WaitingList",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
