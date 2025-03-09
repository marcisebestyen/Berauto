using Database.Dtos;
using Database.Data;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Database.Models;

namespace Services.Services
{
    public interface IReceiptService
    {
        Task<ReceiptDto> AddReceipt(CreateReceiptDto receiptDto);
        Task<ReceiptDto> GetReceipt(int receiptId);
        Task<List<ReceiptDto>> GetReceipts();
        Task<ReceiptDto> UpdateReceipt(int receiptId, UpdateReceiptDto updateReceiptDto);
        Task<bool> DeleteReceipt(int receiptId);
    }

    public class ReceiptService : IReceiptService
    {
        private readonly BerautoDbContext _context;
        private readonly IMapper _mapper;
        public ReceiptService(BerautoDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }
        public async Task<ReceiptDto> AddReceipt(CreateReceiptDto receiptDto)
        {
            var receipt = _mapper.Map<Receipt>(receiptDto);
            await _context.Receipts.AddAsync(receipt);
            await _context.SaveChangesAsync();
            return _mapper.Map<ReceiptDto>(receipt);
        }
        public async Task<ReceiptDto> GetReceipt(int receiptId)
        {
            var receipt = await _context.Receipts
                .Include(r => r.Rent)
                .FirstOrDefaultAsync(r => r.Id == receiptId);
            if (receipt == null)
            {
                throw new ArgumentException("The given receipt does not exist.");
            }
            return _mapper.Map<ReceiptDto>(receipt);
        }
        public async Task<List<ReceiptDto>> GetReceipts()
        {
            var receipts = await _context.Receipts
                .Include(r => r.Rent)
                .ToListAsync();
            return _mapper.Map<List<ReceiptDto>>(receipts);
        }
        public async Task<ReceiptDto> UpdateReceipt(int receiptId, UpdateReceiptDto updateReceiptDto)
        {
            var receipt = await _context.Receipts
                .Include(r => r.Rent)
                .FirstOrDefaultAsync(r => r.Id == receiptId);
            if (receipt == null)
            {
                throw new ArgumentException("The given receipt does not exist.");
            }
            _mapper.Map(updateReceiptDto, receipt);
            await _context.SaveChangesAsync();
            return _mapper.Map<ReceiptDto>(receipt);
        }
        public async Task<bool> DeleteReceipt(int receiptId)
        {
            var receipt = await _context.Receipts
                .FirstOrDefaultAsync(r => r.Id == receiptId);
            if (receipt == null)
            {
                throw new ArgumentException("The given receipt does not exist.");
            }
            _context.Receipts.Remove(receipt);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
