using Database.Models;
using Services.Repositories;
using Database.Dtos.CarDtos;
using AutoMapper;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc;

namespace Services.Services;
public interface ICarService
{
    Task<IEnumerable<CarGetDto>> GetAllCarsAsync();
    Task<CarGetDto?> GetCarByIdAsync(int id);
    Task<CarGetDto> AddCarAsync(CarCreateDto createCarDto);
    Task UpdateCarAsync(int id, JsonPatchDocument<Car> patchDocument, ModelStateDictionary modelState);
    Task DeleteCarAsync(int id);
    Task UpdateCarKilometersAsync(int id, decimal newKilometers);
    Task<IEnumerable<CarGetDto>> GetAvailableCarsAsync(DateTime startDate, DateTime endDate);
    Task SetCarConditionAsync(int id, bool inProperCondition);
}
public class CarService : ICarService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CarService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
    }

    public async Task<IEnumerable<CarGetDto>> GetAllCarsAsync()
    {
        var cars = await _unitOfWork.CarRepository.GetAllAsync();
        return _mapper.Map<IEnumerable<CarGetDto>>(cars);
    }

    public async Task<CarGetDto?> GetCarByIdAsync(int id)
    {
        var car = await _unitOfWork.CarRepository.GetByIdAsync(new object[] { id });
        if (car == null)
        {
            return null;
        }
        return _mapper.Map<CarGetDto>(car);
    }

    public async Task<CarGetDto> AddCarAsync(CarCreateDto createCarDto)
    {
        var car = _mapper.Map<Car>(createCarDto);

        await _unitOfWork.CarRepository.InsertAsync(car);
        await _unitOfWork.SaveAsync();

        return _mapper.Map<CarGetDto>(car);
    }
    public async Task UpdateCarAsync(int id, JsonPatchDocument<Car> patchDocument, ModelStateDictionary modelState)
    {
        if (patchDocument == null)
        {
            // A controllernek kellene ezt először ellenőriznie, de a biztonság kedvéért itt is.
            // Hozzáadhatunk hibát a modelState-hez, vagy dobhatunk kivételt.
            // Ha a service dob kivételt, a controllernek azt kell elkapnia.
            // Most dobjunk kivételt, hogy a controller tudja, mi a gond.
            throw new ArgumentNullException(nameof(patchDocument), "A patch dokumentum nem lehet null.");
        }

        var existingCar = await _unitOfWork.CarRepository.GetByIdAsync(new object[] { id });
        if (existingCar == null)
        {
            throw new KeyNotFoundException($"Car with id {id} not found.");
        }

        // Alkalmazzuk a patch műveleteket a meglévő entitásra.
        // Az ApplyTo metódus a 'modelState'-be írja a patch alkalmazása során felmerülő hibákat
        // (pl. érvénytelen elérési út, "test" művelet sikertelensége).
        patchDocument.ApplyTo(existingCar, modelState);

        // Ellenőrizzük, hogy maga a patch alkalmazása adott-e hibát a ModelState-hez.
        if (!modelState.IsValid)
        {
            // Ha az ApplyTo hibát talált, akkor itt kivételt dobunk, amit a controller
            // elkaphat és BadRequest(ModelState) választ adhat.
            // Azért ArgumentException, mert a patchDocument tartalma volt hibás.
            throw new ArgumentException("A JSON Patch dokumentum műveletei hibát eredményeztek. Lásd ModelState a részletekért.", nameof(patchDocument));
        }

        // Opcionális, de ERŐSEN AJÁNLOTT:
        // Miután a patch-et alkalmaztuk, validáljuk az EGÉSZ 'existingCar' entitást
        // az entitáson lévő DataAnnotations attribútumok ([Required], [StringLength] stb.) alapján.
        // A JsonPatchDocument.ApplyTo önmagában nem futtatja ezeket a validációkat az entitás teljes állapotára.
        // Ezt a controllerben a TryValidateModel(existingCarEntity) hívással,
        // vagy itt a service-ben a Validator osztállyal tehetnéd meg.
        // Ha itt validálsz és hibát találsz, szintén dobj kivételt vagy add hozzá a ModelState-hez.
        // Példa (ehhez kell using System.ComponentModel.DataAnnotations;):
        // var validationContext = new ValidationContext(existingCar, serviceProvider: null, items: null);
        // var validationResults = new List<ValidationResult>();
        // bool isEntityValid = Validator.TryValidateObject(existingCar, validationContext, validationResults, true);
        // if (!isEntityValid)
        // {
        //     foreach (var validationResult in validationResults)
        //     {
        //         foreach (var memberName in validationResult.MemberNames) // Lehet, hogy üres
        //         {
        //             modelState.AddModelError(memberName ?? string.Empty, validationResult.ErrorMessage);
        //         }
        //     }
        //     throw new ArgumentException("Az entitás validációja sikertelen a patch alkalmazása után.", nameof(existingCar));
        // }


        // Az EF Core változáskövetése észleli a 'existingCar' entitáson történt módosításokat.
        await _unitOfWork.CarRepository.UpdateAsync(existingCar); // Ez beállítja az entitás állapotát 'Modified'-re
        await _unitOfWork.SaveAsync();
        // Ha idáig eljutottunk, a művelet sikeres volt. A metódus Task, nincs visszatérési érték.
    }

    public async Task DeleteCarAsync(int id)
    {
        try
        {
            await _unitOfWork.CarRepository.DeleteAsync(id);
            await _unitOfWork.SaveAsync();
        }
        catch (KeyNotFoundException)
        {
            throw; 
        }
    }

    public async Task UpdateCarKilometersAsync(int id, decimal newKilometers)
    {
        var car = await _unitOfWork.CarRepository.GetByIdAsync(new object[] { id });
        if (car != null)
        {
            car.ActualKilometers = newKilometers;
            await _unitOfWork.CarRepository.UpdateAsync(car);
            await _unitOfWork.SaveAsync();
        }
        else
        {
            throw new KeyNotFoundException($"Car with id {id} not found.");
        }
    }

    public async Task<IEnumerable<CarGetDto>> GetAvailableCarsAsync(DateTime startDate, DateTime endDate)
    {
        var rentedCarIds = (await _unitOfWork.RentRepository.GetAsync(
            rent => rent.PlannedStart < endDate && rent.PlannedEnd > startDate
        ))
        .Select(rent => rent.CarId)
        .Distinct()
        .ToList();

        var availableCarsEntities = await _unitOfWork.CarRepository.GetAsync(
            car => car.InProperCondition && !rentedCarIds.Contains(car.Id)
        );

        return _mapper.Map<IEnumerable<CarGetDto>>(availableCarsEntities);
    }

    public async Task SetCarConditionAsync(int id, bool inProperCondition)
    {
        var car = await _unitOfWork.CarRepository.GetByIdAsync(new object[] { id });
        if (car != null)
        {
            car.InProperCondition = inProperCondition;
            await _unitOfWork.CarRepository.UpdateAsync(car);
            await _unitOfWork.SaveAsync();
        }
        else
        {
            throw new KeyNotFoundException($"Car with id {id} not found.");
        }
    }
}