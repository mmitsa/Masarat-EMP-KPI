FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files for restore
COPY ["backend/modules/epm/Masarat.EPM.API/Masarat.EPM.API.csproj", "Masarat.EPM.API/"]
COPY ["backend/modules/epm/Masarat.EPM.Application/Masarat.EPM.Application.csproj", "Masarat.EPM.Application/"]
COPY ["backend/modules/epm/Masarat.EPM.Domain/Masarat.EPM.Domain.csproj", "Masarat.EPM.Domain/"]
COPY ["backend/modules/epm/Masarat.EPM.Infrastructure/Masarat.EPM.Infrastructure.csproj", "Masarat.EPM.Infrastructure/"]
COPY ["backend/core/Masarat.Core/Masarat.Core.csproj", "Masarat.Core/"]

RUN dotnet restore "Masarat.EPM.API/Masarat.EPM.API.csproj"

# Copy everything and build
COPY backend/ .
WORKDIR "/src/modules/epm/Masarat.EPM.API"
RUN dotnet build "Masarat.EPM.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Masarat.EPM.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# تشغيل كمستخدم غير root لأمان أفضل
RUN adduser --disabled-password --gecos "" --uid 1000 appuser && chown -R appuser:appuser /app
USER appuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

ENTRYPOINT ["dotnet", "Masarat.EPM.API.dll"]
