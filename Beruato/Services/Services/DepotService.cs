using System.ComponentModel.DataAnnotations;
using Database.Models;
using Services.Repositories;
using Database.Dtos.DepotDtos; 
using AutoMapper;
using Database.Results;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc;

namespace Services.Services;

public interface IDepotService
{
    Task<IEnumerable<DepotGetDto>> GetAllDepotsAsync();
    Task<DepotGetDto?> GetDepotByIdAsync(int id);
    Task<DepotGetDto> AddDepotAsync(DepotCreateDto createDepotDto);
    Task<ServiceResult> UpdateDepotAsync(int id, JsonPatchDocument<Depot> patchDocument, ModelStateDictionary modelState);
    Task DeleteDepotAsync(int id);
}

public class DepotService : IDepotService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public DepotService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
    }

    public async Task<IEnumerable<DepotGetDto>> GetAllDepotsAsync()
    {
        var depots = await _unitOfWork.DepotRepository.GetAllAsync();
        return _mapper.Map<IEnumerable<DepotGetDto>>(depots);
    }

    public async Task<DepotGetDto?> GetDepotByIdAsync(int id)
    {
        var depot = await _unitOfWork.DepotRepository.GetByIdAsync(new object[] { id });
        
        if (depot == null)
        {
            return null;
        }

        return _mapper.Map<DepotGetDto>(depot);
    }

    public async Task<DepotGetDto> AddDepotAsync(DepotCreateDto createDepotDto)
    {
        var depot = _mapper.Map<Depot>(createDepotDto);

        await _unitOfWork.DepotRepository.InsertAsync(depot);
        await _unitOfWork.SaveAsync();

        return _mapper.Map<DepotGetDto>(depot);
    }

    public async Task<ServiceResult> UpdateDepotAsync(int id, JsonPatchDocument<Depot> patchDocument, ModelStateDictionary modelState)
    {
        var existingDepot = await _unitOfWork.DepotRepository.GetByIdAsync(new object[] { id });
        
        if (existingDepot == null)
        {
            throw new KeyNotFoundException($"A {id} azonosítójú telephely nem található.");
        }

        patchDocument.ApplyTo(existingDepot, modelState);

        if (!modelState.IsValid)
        {
            throw new ArgumentException("A JSON Patch dokumentum műveletei hibát eredményeztek.", nameof(patchDocument));
        }

        var validationContext = new ValidationContext(existingDepot, serviceProvider: null, items: null);
        var validationResults = new List<ValidationResult>();
        bool isEntityValid = Validator.TryValidateObject(existingDepot, validationContext, validationResults, validateAllProperties: true);

        if (!isEntityValid)
        {
            foreach (var validationResult in validationResults)
            {
                if (validationResult.MemberNames.Any())
                {
                    foreach (var memberName in validationResult.MemberNames)
                    {
                        modelState.AddModelError(memberName, validationResult.ErrorMessage ?? "Validációs hiba");
                    }
                }
                else
                {
                    modelState.AddModelError(string.Empty, validationResult.ErrorMessage ?? "Validációs hiba");
                }
            }

            throw new ArgumentException("Az entitás validációja sikertelen a patch alkalmazása után.", nameof(existingDepot));
        }

        await _unitOfWork.SaveAsync();

        return ServiceResult.Success("Telephely sikeresen frissítve.");
    }

    public async Task DeleteDepotAsync(int id)
    {
        var depotToDelete = await _unitOfWork.DepotRepository.GetByIdAsync(new object[] { id });
        
        if (depotToDelete == null)
        {
            throw new KeyNotFoundException($"A(z) {id} azonosítójú telephely nem található.");
        }

        await _unitOfWork.DepotRepository.DeleteAsync(id);
        await _unitOfWork.SaveAsync();
    }
}